"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { commissionRows, type CommissionRow } from "@huelegood/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./primitives";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

export function AdminDataTable({
  title,
  description,
  headers,
  rows,
  pageSize = 20
}: {
  title: string;
  description?: string;
  headers: string[];
  rows: Array<Array<ReactNode>>;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedRows = rows.slice(start, start + pageSize);

  return (
    <Card className="rounded-[1.6rem] border-black/8 bg-white shadow-[0_12px_34px_rgba(18,34,20,0.05)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader className="bg-[#f7f8f4]">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 ? (
        <CardFooter className="flex items-center justify-between">
          <p className="text-xs text-black/45">
            Página {page} de {totalPages} · {rows.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function CommissionTable({ rows = commissionRows }: { rows?: CommissionRow[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedRows = rows.slice(start, start + pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisiones</CardTitle>
        <CardDescription>Saldo pendiente, pagable y liquidado.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Ventas</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Periodo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.code}>
                <TableCell>{row.vendor}</TableCell>
                <TableCell>{row.code}</TableCell>
                <TableCell>{formatCurrency(row.totalSales)}</TableCell>
                <TableCell>{formatCurrency(row.commission)}</TableCell>
                <TableCell>
                  <Badge tone={row.status === "paid" ? "success" : row.status === "blocked" ? "danger" : "warning"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>{row.period}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 ? (
        <CardFooter className="flex items-center justify-between">
          <p className="text-xs text-black/45">
            Página {page} de {totalPages} · {rows.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}
