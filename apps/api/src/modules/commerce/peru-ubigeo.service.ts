import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  PeruDepartmentSummary,
  PeruDistrictSummary,
  PeruProvinceSummary,
  WarehouseServiceAreaScopeValue
} from "@huelegood/shared";
import departmentsDataset from "./data/peru-departments.json";
import provincesDataset from "./data/peru-provinces.json";
import districtsDataset from "./data/peru-districts.json";

type DepartmentRecord = {
  id: number;
  departamento: string;
  ubigeo: string;
};

type ProvinceRecord = {
  id: number;
  provincia: string;
  ubigeo: string;
  departamento_id: number;
};

type DistrictRecord = {
  id: number;
  distrito: string;
  ubigeo: string;
  provincia_id: number;
  departamento_id: number;
};

type Dataset<T> = {
  [key: string]: T[];
};

function normalizeCode(value?: string) {
  const normalized = value?.trim().replace(/\D/g, "");
  return normalized || undefined;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-PE")
    .replace(/\b([a-záéíóúñ])/gu, (match) => match.toLocaleUpperCase("es-PE"));
}

@Injectable()
export class PeruUbigeoService {
  private readonly departments = ((departmentsDataset as Dataset<DepartmentRecord>).ubigeo_departamentos ?? []).map((record) => ({
    id: record.id,
    code: record.ubigeo,
    name: toTitleCase(record.departamento)
  }));

  private readonly provinces = ((provincesDataset as Dataset<ProvinceRecord>).ubigeo_provincias ?? []).map((record) => ({
    id: record.id,
    code: record.ubigeo,
    name: toTitleCase(record.provincia),
    departmentId: record.departamento_id,
    departmentCode: record.ubigeo.slice(0, 2)
  }));

  private readonly districts = ((districtsDataset as Dataset<DistrictRecord>).ubigeo_distritos ?? []).map((record) => ({
    id: record.id,
    code: record.ubigeo,
    name: toTitleCase(record.distrito),
    provinceId: record.provincia_id,
    provinceCode: record.ubigeo.slice(0, 4),
    departmentId: record.departamento_id,
    departmentCode: record.ubigeo.slice(0, 2)
  }));

  private readonly departmentsByCode = new Map(this.departments.map((record) => [record.code, record] as const));

  private readonly provincesByCode = new Map(this.provinces.map((record) => [record.code, record] as const));

  private readonly districtsByCode = new Map(this.districts.map((record) => [record.code, record] as const));

  listDepartments(): PeruDepartmentSummary[] {
    return this.departments.map(({ code, name }) => ({ code, name }));
  }

  listProvinces(departmentCode: string): PeruProvinceSummary[] {
    const normalizedDepartmentCode = this.requireDepartmentCode(departmentCode);

    return this.provinces
      .filter((record) => record.departmentCode === normalizedDepartmentCode)
      .map(({ code, name, departmentCode: nextDepartmentCode }) => ({
        code,
        name,
        departmentCode: nextDepartmentCode
      }));
  }

  listDistricts(provinceCode: string): PeruDistrictSummary[] {
    const normalizedProvinceCode = this.requireProvinceCode(provinceCode);

    return this.districts
      .filter((record) => record.provinceCode === normalizedProvinceCode)
      .map(({ code, name, departmentCode, provinceCode: nextProvinceCode }) => ({
        code,
        name,
        departmentCode,
        provinceCode: nextProvinceCode
      }));
  }

  describeServiceArea(scopeType: WarehouseServiceAreaScopeValue, scopeCode?: string) {
    const normalizedCode = normalizeCode(scopeCode);
    if (!normalizedCode) {
      return undefined;
    }

    if (scopeType === "department") {
      return this.departmentsByCode.get(normalizedCode)?.name;
    }

    if (scopeType === "province") {
      const province = this.provincesByCode.get(normalizedCode);
      if (!province) {
        return undefined;
      }

      const department = this.departmentsByCode.get(province.departmentCode);
      return [province.name, department?.name].filter(Boolean).join(", ");
    }

    if (scopeType === "district") {
      const district = this.districtsByCode.get(normalizedCode);
      if (!district) {
        return undefined;
      }

      const province = this.provincesByCode.get(district.provinceCode);
      const department = this.departmentsByCode.get(district.departmentCode);
      return [district.name, province?.name, department?.name].filter(Boolean).join(", ");
    }

    return normalizedCode;
  }

  resolveSelection(input: { departmentCode?: string; provinceCode?: string; districtCode?: string }) {
    const departmentCode = this.requireDepartmentCode(input.departmentCode);
    const provinceCode = this.requireProvinceCode(input.provinceCode);
    const districtCode = this.requireDistrictCode(input.districtCode);

    const department = this.departmentsByCode.get(departmentCode);
    const province = this.provincesByCode.get(provinceCode);
    const district = this.districtsByCode.get(districtCode);

    if (!department) {
      throw new BadRequestException("Selecciona un departamento válido de Perú.");
    }

    if (!province || province.departmentCode !== department.code) {
      throw new BadRequestException("Selecciona una provincia válida para el departamento elegido.");
    }

    if (!district || district.departmentCode !== department.code || district.provinceCode !== province.code) {
      throw new BadRequestException("Selecciona un distrito válido para la provincia elegida.");
    }

    return {
      departmentCode: department.code,
      departmentName: department.name,
      provinceCode: province.code,
      provinceName: province.name,
      districtCode: district.code,
      districtName: district.name
    };
  }

  private requireDepartmentCode(value?: string) {
    const normalized = normalizeCode(value);
    if (!normalized || normalized.length !== 2) {
      throw new BadRequestException("Debes seleccionar un departamento válido.");
    }

    return normalized;
  }

  private requireProvinceCode(value?: string) {
    const normalized = normalizeCode(value);
    if (!normalized || normalized.length !== 4) {
      throw new BadRequestException("Debes seleccionar una provincia válida.");
    }

    return normalized;
  }

  private requireDistrictCode(value?: string) {
    const normalized = normalizeCode(value);
    if (!normalized || normalized.length !== 6) {
      throw new BadRequestException("Debes seleccionar un distrito válido.");
    }

    return normalized;
  }
}
