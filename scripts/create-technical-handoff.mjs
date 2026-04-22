#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const handoffDir = path.join(repoRoot, "docs", "handoffs");

function readArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getDateStamp(value) {
  if (value) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function buildTemplate({ dateStamp, owner, title, mode, summary, outputPath }) {
  return `# ${title}

- fecha: ${dateStamp}
- owner: ${owner}
- modalidad: ${mode}
- estado: draft
- ruta: ${path.relative(repoRoot, outputPath)}

## Solicitud original

Pendiente de completar.

## Brief normalizado
- contexto:
- problema:
- objetivo:
- alcance:
- restricciones:

## Destino en docs
- modo: create | update
- carpeta:
- archivo principal:
- handoff técnico: ${path.relative(repoRoot, outputPath)}
- archivos relacionados a revisar:

## Resumen ejecutivo del cambio

${summary}

## Cambios técnicos ejecutados
- módulos o capas:
- archivos tocados:
- decisiones implementadas:

## Validación ejecutada
- comandos:
- resultado:
- cobertura pendiente:

## Riesgos, deuda y siguiente paso
- riesgos:
- deuda:
- siguiente paso recomendado:

## Fuente de verdad previa
- documentos existentes:
- decisiones que no deben contradecirse:

## Agentes fuente
- agente principal:
- agentes de soporte:

## Skills aplicadas

## Checklist de cierre
- [ ] terminología alineada con glosario
- [ ] no se duplican decisiones existentes
- [ ] se revisaron documentos vecinos
- [ ] existe update documental o handoff explícito
- [ ] si el archivo es nuevo, se actualiza docs/README.md
`;
}

async function main() {
  const options = readArgs(process.argv.slice(2));
  const slug = slugify(options.slug);

  if (!slug) {
    console.error("Uso: node scripts/create-technical-handoff.mjs --slug <slug> [--title <title>] [--owner <owner>] [--mode <mode>] [--summary <summary>] [--date YYYY-MM-DD] [--force]");
    process.exit(1);
  }

  const dateStamp = getDateStamp(options.date);
  const owner = String(options.owner || "Delta");
  const mode = String(options.mode || "technical-handoff");
  const title = String(options.title || `Cierre técnico: ${slug}`);
  const summary = String(
    options.summary || "Pendiente de completar. Este archivo fue generado como base de handoff técnico."
  );
  const outputPath = path.join(handoffDir, `${dateStamp}-${slug}.md`);

  await fs.mkdir(handoffDir, { recursive: true });

  if (!options.force) {
    try {
      await fs.access(outputPath);
      console.error(`El archivo ya existe: ${path.relative(repoRoot, outputPath)}. Usa --force para sobrescribirlo.`);
      process.exit(1);
    } catch {
      // No existe todavía.
    }
  }

  const content = buildTemplate({
    dateStamp,
    owner,
    title,
    mode,
    summary,
    outputPath
  });

  await fs.writeFile(outputPath, content, "utf8");
  process.stdout.write(`${path.relative(repoRoot, outputPath)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
