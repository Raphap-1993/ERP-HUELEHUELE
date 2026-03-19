import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { isConfigured } from "../common/env";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ModuleStateService {
  constructor(private readonly prisma: PrismaService) {}

  async load<T>(moduleName: string): Promise<T | null> {
    if (!isConfigured(process.env.DATABASE_URL)) {
      return null;
    }

    try {
      const snapshot = await this.prisma.moduleSnapshot.findUnique({
        where: {
          moduleName
        }
      });

      if (!snapshot) {
        return null;
      }

      return this.toPlainObject(snapshot.snapshot) as T;
    } catch (error) {
      console.warn(`[persistence] no pudimos leer el snapshot ${moduleName}`, error);
      return null;
    }
  }

  async save<T>(moduleName: string, snapshot: T, version = 1) {
    if (!isConfigured(process.env.DATABASE_URL)) {
      return;
    }

    try {
      const payload = this.toPlainObject(snapshot) as Prisma.InputJsonValue;
      await this.prisma.moduleSnapshot.upsert({
        where: {
          moduleName
        },
        create: {
          moduleName,
          snapshot: payload,
          version
        },
        update: {
          snapshot: payload,
          version
        }
      });
    } catch (error) {
      console.warn(`[persistence] no pudimos guardar el snapshot ${moduleName}`, error);
    }
  }

  private toPlainObject(value: unknown) {
    if (value === null || value === undefined) {
      return value;
    }

    return JSON.parse(JSON.stringify(value));
  }
}
