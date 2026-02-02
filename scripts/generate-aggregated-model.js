#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'src', 'data');
const distDir = path.join(rootDir, 'dist');

// CLI args: --template <path> --out <path>
const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const inline = args.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=')[1];
  return fallback;
};
const templatePath = argValue('--template', path.join(rootDir, 'templates', 'capability-catalog.md.tmpl'));
const outputPath = argValue('--out', path.join(distDir, 'capabilities.md'));

// ---------- helpers ----------
const readJson = (relPath) => {
  const fullPath = path.isAbsolute(relPath) ? relPath : path.join(dataDir, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw);
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// ---------- maturity config (mirrors src/data/maturity-config.ts) ----------
const MATURITY_DIMENSIONS = [
  {
    id: 'adoption',
    name: 'Adoption',
    weight: 20,
    color: '#1E88E5',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 2l7 7h-4v9h-6v-9H5l7-7z',
    subdimensions: [
      {
        id: 'adoption.use-case',
        dimensionId: 'adoption',
        name: 'Use Case Adoption',
        source: 'hvia',
        weight: 5,
      },
      {
        id: 'adoption.effort',
        dimensionId: 'technology',
        name: 'Adoption Effort',
        source: 'capability',
        weight: 15,
      },
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    weight: 20,
    color: '#6A1B9A',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l2-2-2-2-2 2a7.96 7.96 0 00-2.34-1.35l-.33-2.82h-4.66l-.33 2.82A7.96 7.96 0 006.99 10L5 8l-2 2 2 2a7.96 7.96 0 001.35 2.34l-2.82.33v4.66l2.82.33A7.96 7.96 0 0010 21l2 2 2-2a7.96 7.96 0 002.34-1.35l2.82.33v-4.66l-2.82-.33A7.96 7.96 0 0021 12z',
    subdimensions: [
      {
        id: 'technology.development-activity',
        dimensionId: 'technology',
        name: 'Development Activity',
        source: 'capability',
        weight: 10,
      },
      {
        id: 'technology.operations',
        dimensionId: 'technology',
        name: 'Operations',
        source: 'capability',
        weight: 10,
      },
    ],
  },
  {
    id: 'process',
    name: 'Process',
    weight: 30,
    color: '#F57C00',
    iconViewBox: '0 0 24 24',
    iconPath: 'M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4z',
    subdimensions: [
      {
        id: 'process.documentation',
        dimensionId: 'process',
        name: 'Documentation',
        source: 'capability',
        weight: 15,
      },
      {
        id: 'process.self-service',
        dimensionId: 'process',
        name: 'Self-service',
        source: 'product',
        weight: 15,
      },
    ],
  },
  {
    id: 'people',
    name: 'People',
    weight: 25,
    color: '#2E7D32',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 12a4 4 0 10-4-4 4 4 0 004 4zm-6 8a6 6 0 0112 0v2H6z M17 8a3 3 0 103-3 3 3 0 00-3 3zm-1 12h8v-1a4 4 0 00-5-3.87 6.92 6.92 0 01-2.8 2.37V20z',
    subdimensions: [
      { id: 'people.roles', dimensionId: 'people', name: 'Roles & Responsibilities', source: 'product', weight: 5 },
      { id: 'people.skills', dimensionId: 'people', name: 'Skills', source: 'product', weight: 5 },
      { id: 'people.capacity', dimensionId: 'people', name: 'Capacity', source: 'product', weight: 10 },
      { id: 'people.product-guidance', dimensionId: 'people', name: 'Product Guidance', source: 'product', weight: 5 },
    ],
  },
];

const MATURITY_SUBDIMENSION_MAP = MATURITY_DIMENSIONS.flatMap((dim) => dim.subdimensions)
  .reduce((acc, sub) => {
    acc[sub.id] = sub;
    return acc;
  }, {});

const clampMaturityValue = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return clamp(Math.round(value), 0, 4);
};

const sanitizeMaturityEntries = (entityLabel, raw, allowedSources) => {
  if (!raw) return {};
  const allowed = allowedSources ? new Set(allowedSources) : null;
  return Object.entries(raw).reduce((acc, [key, entry]) => {
    const definition = MATURITY_SUBDIMENSION_MAP[key];
    if (!definition) {
      throw new Error(`${entityLabel} references unknown maturity subdimension "${key}". Update maturity-config.ts.`);
    }
    if (allowed && !allowed.has(definition.source)) {
      throw new Error(`${entityLabel} cannot set ${definition.name} because it belongs to ${definition.source}.`);
    }
    if (entry?.value === null) {
      acc[key] = {
        value: null,
        reason: entry?.reason,
      };
      return acc;
    }
    acc[key] = {
      value: clampMaturityValue(entry?.value),
      reason: entry?.reason,
    };
    return acc;
  }, {});
};

const mergeMaturityMaps = (base, overrides) => {
  if (!overrides) return { ...base };
  return { ...base, ...overrides };
};

const readDescriptionMarkdown = (cap, warnings) => {
  const rel = cap.descriptionFile || '';
  if (!rel) return cap.description || '';
  const relPath = rel.replace(/^\.\//, '');
  const fullPath = path.join(dataDir, 'capabilities', relPath);
  if (!fs.existsSync(fullPath)) {
    if (warnings) warnings.push(`Description file not found for ${cap.id}: ${rel}`);
    return cap.description || '';
  }
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    if (warnings) warnings.push(`Failed to read description for ${cap.id} from ${rel}: ${error.message}`);
    return cap.description || '';
  }
};

const createZeroMaturitySummary = (reason) => {
  const dimensions = MATURITY_DIMENSIONS.reduce((dimAcc, dimension) => {
    const subdimensions = dimension.subdimensions.reduce((subAcc, sub) => {
      subAcc[sub.id] = {
        id: sub.id,
        name: sub.name,
        weight: sub.weight,
        value: 0,
        reason,
      };
      return subAcc;
    }, {});
    dimAcc[dimension.id] = {
      id: dimension.id,
      name: dimension.name,
      color: dimension.color,
      iconPath: dimension.iconPath,
      iconViewBox: dimension.iconViewBox,
      weight: dimension.weight,
      value: 0,
      subdimensions,
    };
    return dimAcc;
  }, {});
  return { total: 0, dimensions };
};

// ---------- maturity computation (adapted from capabilities-loader) ----------
const getStatusMaturity = (capability) => {
  const { status } = capability;
  if (status === 'implemented') return 4;
  if (status === 'partially') return 2;
  if (status === 'not implemented') return 0;
  if (typeof status === 'number' && Number.isFinite(status)) {
    return clamp(Math.floor(status), 0, 4);
  }
  return 0;
};

const countActiveUseCases = (cap) => {
  const useCases = cap.useCases || [];
  let active = 0;
  let requested = 0;
  for (const uc of useCases) {
    if ((uc.maturity ?? 0) >= 1) requested += 1;
    if ((uc.maturity ?? 0) >= 2) active += 1;
  }
  return { active, requested };
};

const deriveCapabilityDefaults = (cap) => {
  const statusScore = Math.max(1, getStatusMaturity(cap) || 1);
  const { active } = countActiveUseCases(cap);
  const documentationLength = (cap.descriptionMarkdown ?? cap.description ?? '').length;
  let documentationValue = 1;
  if (documentationLength > 400) documentationValue = 4;
  else if (documentationLength > 250) documentationValue = 3;
  else if (documentationLength > 120) documentationValue = 2;
  if (cap.link) documentationValue = Math.min(4, documentationValue + 1);

  const devBoost = active >= 5 ? 1 : active >= 2 ? 0.5 : 0;
  const developmentValue = Math.min(4, statusScore + devBoost);

  return {
    'adoption.effort': {
      value: Math.min(4, statusScore),
      reason: `Derived from capability status "${cap.status}".`,
    },
    'technology.development-activity': {
      value: developmentValue,
      reason: active > 0 ? `Active in ${active} HVIA use cases.` : 'No HVIA activity yet.',
    },
    'process.documentation': {
      value: documentationValue,
      reason: cap.link ? 'Detailed description with external reference.' : 'Limited documentation available.',
    },
  };
};

const deriveHviaDefaults = (cap) => {
  const { active, requested } = countActiveUseCases(cap);
  const reason = active > 0
    ? `Active in ${active} HVIA use case${active === 1 ? '' : 's'}.`
    : requested > 0
      ? 'Requested by HVIA teams but not in active use.'
      : 'No linked HVIA use cases.';

  let value = 1;
  if (active === 0) value = 1;
  else if (active <= 2) value = 1;
  else if (active <= 5) value = 2;
  else if (active <= 10) value = 3;
  else value = 4;

  return {
    'adoption.use-case': {
      value,
      reason,
    },
  };
};

const defaultReasonBySource = {
  capability: 'Baseline capability signal not provided.',
  implementation: 'Implementation does not expose this maturity data.',
  hvia: 'No HVIA usage recorded yet.',
  product: 'Product maturity signal not provided.',
};

const buildCapabilityMaturity = (cap) => {
  if (!cap.tool) {
    return {
      summary: createZeroMaturitySummary('Capability has no linked implementation.'),
      inputs: {},
    };
  }

  const defaults = deriveCapabilityDefaults(cap);
  const overrides = sanitizeMaturityEntries(`Capability ${cap.id}`, cap.maturityInputs, ['capability']);
  const capabilityInputs = mergeMaturityMaps(defaults, overrides);
  const hviaInputs = deriveHviaDefaults(cap);
  const implementationInputs = mergeMaturityMaps({}, cap.tool.maturityInputs ?? {});
  const productBase = cap.product?.maturityInputs ?? {};
  const productInputs = cap.productOverrides
    ? mergeMaturityMaps(productBase, cap.productOverrides)
    : { ...productBase };

  const summary = { total: 0, dimensions: {} };
  let totalWeight = 0;
  let weightedSum = 0;

  for (const dimension of MATURITY_DIMENSIONS) {
    const subSnapshots = {};
    let dimensionWeightSum = 0;
    let dimensionValueSum = 0;

    for (const sub of dimension.subdimensions) {
      let sourceMap;
      if (sub.source === 'capability') sourceMap = capabilityInputs;
      else if (sub.source === 'implementation') sourceMap = implementationInputs;
      else if (sub.source === 'product') sourceMap = productInputs;
      else sourceMap = hviaInputs;

      const entry = sourceMap[sub.id];
      const rawValue = entry?.value;
      const isSkipped = rawValue === null;
      let value = isSkipped ? 0 : rawValue ?? 0;
      let reason = entry?.reason;

      if (!cap.tool) value = 0;
      if (!reason) {
        if (isSkipped) {
          reason = 'Not scored; excluded from maturity calculation.';
        } else if (sub.source === 'implementation' && !cap.tool) {
          reason = 'No implementation linked to this capability.';
        } else {
          reason = defaultReasonBySource[sub.source];
        }
      }

      subSnapshots[sub.id] = {
        id: sub.id,
        name: sub.name,
        weight: sub.weight,
        value,
        reason,
      };

      if (!isSkipped) {
        dimensionWeightSum += sub.weight;
        dimensionValueSum += value * sub.weight;
      }
    }

    const hasScoredSubdimensions = dimensionWeightSum > 0;
    const dimensionValue = hasScoredSubdimensions ? dimensionValueSum / dimensionWeightSum : 0;
    summary.dimensions[dimension.id] = {
      id: dimension.id,
      name: dimension.name,
      color: dimension.color,
      iconPath: dimension.iconPath,
      iconViewBox: dimension.iconViewBox,
      weight: dimension.weight,
      value: Number(dimensionValue.toFixed(2)),
      subdimensions: subSnapshots,
    };

    if (hasScoredSubdimensions) {
      totalWeight += dimension.weight;
      weightedSum += dimensionValue * dimension.weight;
    }
  }

  summary.total = totalWeight ? Number((weightedSum / totalWeight).toFixed(2)) : 0;
  return { summary, inputs: capabilityInputs };
};

// ---------- join helpers ----------
const hasDocLink = (doc) => Boolean(doc && typeof doc.url === 'string' && doc.url.trim().length > 0);
const normalizeDocLink = (doc) => ({
  url: doc.url,
  title: doc.title ?? doc.description,
  description: doc.description,
});

const resolveDocumentationLink = (cap, product) => {
  if (hasDocLink(cap.productDocumentation)) {
    const normalized = normalizeDocLink(cap.productDocumentation);
    return { ...normalized, productId: cap.productId ?? product?.id, source: 'capability' };
  }
  if (product && hasDocLink(product.documentation)) {
    const normalized = normalizeDocLink(product.documentation);
    return { ...normalized, title: normalized.title ?? product.name, productId: product.id, source: 'product' };
  }
  return undefined;
};

// ---------- loaders ----------
const loadVendors = (imports) => imports.map((p) => {
  const entry = p.replace(/^\.\//, '');
  const vendor = readJson(entry);
  vendor.tools = (vendor.tools || []).map((tool) => ({ ...tool, vendorName: vendor.name, vendorId: vendor.id }));
  return vendor;
});

const loadHVIAs = (imports) => imports.map((p) => readJson(p.replace(/^\.\//, '')));
const loadProducts = (imports) => imports.map((p) => readJson(p.replace(/^\.\//, '')));
const loadVersions = (imports) => imports.flatMap((p) => readJson(p.replace(/^\.\//, '')));

// ---------- resolve capabilities ----------
const resolveUseCases = (cap, hviaIndex, warnings) => {
  const refs = cap.useCaseRefs || [];
  const resolved = [];
  for (const ref of refs) {
    const hvia = hviaIndex[ref.hviaId];
    if (!hvia) {
      warnings.push(`Capability ${cap.id} references missing HVIA ${ref.hviaId}`);
      continue;
    }
    const uc = hvia.useCases.find((u) => u.id === ref.useCaseId);
    if (!uc) {
      warnings.push(`Capability ${cap.id} references missing use case ${ref.useCaseId} in HVIA ${ref.hviaId}`);
      continue;
    }
    resolved.push({ ...uc, hviaId: ref.hviaId, hviaName: hvia.name, maturity: ref.maturity });
  }
  return resolved;
};

const sanitizeProductOverrides = (cap) => sanitizeMaturityEntries(
  `Capability ${cap.id} product overrides`,
  cap.productOverrides,
  ['product']
);

const resolveCapability = (cap, indexes, warnings, inheritedProductId) => {
  const productId = cap.productId ?? inheritedProductId;
  const product = productId ? indexes.productIndex[productId] : undefined;
  if (productId && !product) warnings.push(`Capability ${cap.id} references missing product ${productId}`);
  const tool = cap.toolId ? indexes.toolIndex[cap.toolId] : undefined;
  if (cap.toolId && !tool) warnings.push(`Capability ${cap.id} references missing tool ${cap.toolId}`);
  const useCases = resolveUseCases(cap, indexes.hviaIndex, warnings);
  const documentationLink = resolveDocumentationLink({ ...cap, productId }, product);
  const productOverrides = sanitizeProductOverrides(cap);
  const productLink = product?.teamLink || product?.documentation?.url || '';
  const descriptionMarkdown = readDescriptionMarkdown(cap, warnings);
  const descriptionText = descriptionMarkdown || cap.description || '';

  const resolved = {
    ...cap,
    description: descriptionText,
    descriptionMarkdown,
    productId,
    product,
    tool,
    useCases,
    documentationLink,
    productDisplay: product ? (productLink ? `[${product.name}](${productLink})` : product.name) : undefined,
    productLink,
  };
  if (Object.keys(productOverrides).length) {
    resolved.productOverrides = productOverrides;
  }
  const { summary, inputs } = buildCapabilityMaturity({ ...resolved, maturityInputs: cap.maturityInputs });
  resolved.maturity = summary;
  resolved.maturityInputs = inputs;
  return resolved;
};

const resolveCluster = (node, indexes, warnings, inheritedProductId) => {
  if (node && typeof node === 'object' && node.type) {
    return resolveCapability(node, indexes, warnings, inheritedProductId);
  }
  const nextProductId = node.productId ?? inheritedProductId;
  const children = (node.children || []).map((child) => resolveCluster(child, indexes, warnings, nextProductId));
  return { ...node, children };
};

// ---------- markdown helpers ----------
const sentenceOrTrim = (text = '') => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(.+?[.!?])(\s|$)/);
  if (match) return match[1].trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

// ---------- tiny templating helper (Mustache-like sections + tokens) ----------
const resolvePath = (obj, pathKey) => {
  const segments = pathKey.split('.');
  let cur = obj;
  for (const seg of segments) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, seg)) {
      cur = cur[seg];
    } else {
      return '';
    }
  }
  return cur ?? '';
};

const renderTemplate = (tmpl, ctx) => {
  // sections: {{#name}}...{{/name}}
  const sectionRegex = /{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g;
  tmpl = tmpl.replace(sectionRegex, (_, key, inner) => {
    const value = resolvePath(ctx, key);
    if (Array.isArray(value)) {
      return value.map((item) => renderTemplate(inner, { ...ctx, '.': item, ...item })).join('');
    }
    if (value && typeof value === 'object') {
      return renderTemplate(inner, { ...ctx, ...value });
    }
    if (value) {
      return renderTemplate(inner, ctx);
    }
    return '';
  });

  // simple tokens: {{key}}
  const tokenRegex = /{{([\w.]+)}}/g;
  return tmpl.replace(tokenRegex, (_, key) => {
    if (key === '.') return ctx['.'] ?? '';
    const value = resolvePath(ctx, key);
    const str = value == null ? '' : String(value);
    return str;
  });
};

// ---------- main ----------
function main() {
  const warnings = [];
  const dataJson = readJson('data.json');

  const vendors = loadVendors(dataJson.toolsData.imports || []);
  const hvias = loadHVIAs(dataJson.hviasData.imports || []);
  const products = loadProducts(dataJson.productsData.imports || []);
  const versions = loadVersions(dataJson.versionsData?.imports || []);

  const toolIndex = {};
  vendors.forEach((vendor) => {
    (vendor.tools || []).forEach((tool) => {
      toolIndex[tool.id] = tool;
    });
  });
  const hviaIndex = {};
  hvias.forEach((hvia) => {
    hviaIndex[hvia.id] = hvia;
  });
  const productIndex = {};
  products.forEach((product) => {
    productIndex[product.id] = product;
  });

  const indexes = { toolIndex, hviaIndex, productIndex };
  const clusters = (dataJson.capabilitiesData.imports || []).map((p) => {
    const entry = p.replace(/^\.\//, '');
    const raw = readJson(entry);
    return resolveCluster(raw, indexes, warnings, raw.productId);
  });

  // flatten capabilities
  const capabilities = [];
  const walk = (node) => {
    if (node && typeof node === 'object' && node.type) {
      capabilities.push(node);
      return;
    }
    (node.children || []).forEach(walk);
  };
  clusters.forEach(walk);

  const buildTemplateFields = (cap) => {
    const maturityRows = [];
    const technologyDimension = cap.maturity?.dimensions?.technology;
    const documentationSnapshot = cap.maturity?.dimensions?.process?.subdimensions?.['process.documentation'];
    const dimensionRows = [];
    if (cap.maturity?.dimensions) {
      Object.values(cap.maturity.dimensions).forEach((dim) => {
        dimensionRows.push({
          id: dim.id,
          name: dim.name,
          weight: dim.weight,
          value: typeof dim.value === 'number' ? dim.value.toFixed(1) : dim.value,
        });
        Object.values(dim.subdimensions || {}).forEach((subdim) => {
          maturityRows.push(subdim);
        });
      });
    }
    return {
      ...cap,
      dimensionRows,
      maturityRows,
      technologyRows: technologyDimension ? Object.values(technologyDimension.subdimensions || {}) : [],
      technologyScore: technologyDimension?.value,
      documentationSnapshot,
      documentationScore: documentationSnapshot?.value,
      documentationReason: documentationSnapshot?.reason,
      useCaseRows: cap.useCases || [],
    };
  };

  const normalizeForTemplate = (cluster) => {
    const childClusters = (cluster.children || []).filter((child) => Array.isArray(child.children));
    const subclusters = childClusters.map((sub) => {
      const capabilities = (sub.children || [])
        .filter((c) => c && typeof c === 'object' && c.type)
        .map(buildTemplateFields);
      return { ...sub, capabilities };
    });

    // Handle clusters that own capabilities directly (no nested subclusters)
    const directCapabilities = (cluster.children || []).filter((child) => child && typeof child === 'object' && child.type);
    if (directCapabilities.length > 0) {
      subclusters.push({
        title: cluster.title,
        id: cluster.id,
        capabilities: directCapabilities.map(buildTemplateFields),
      });
    }

    return { ...cluster, subclusters };
  };

  const renderClusters = clusters.map(normalizeForTemplate);
  const templateCapabilities = [...capabilities].sort((a, b) => a.title.localeCompare(b.title)).map(buildTemplateFields);
  const sortedVersions = [...versions].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);
    if (aValid && bValid && aTime !== bTime) return bTime - aTime;
    if (aValid !== bValid) return bValid ? 1 : -1;
    return b.id.localeCompare(a.id);
  });

  const aggregated = {
    clusters,
    capabilities: templateCapabilities,
    products,
    tools: Object.values(toolIndex),
    vendors,
    hvias,
    versions: sortedVersions,
    warnings,
    renderClusters,
    helpers: {
      shortDescription: (cap) => sentenceOrTrim(cap.descriptionMarkdown || cap.description || ''),
    },
  };

  // Render template
  ensureDir(path.dirname(outputPath));
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const rendered = renderTemplate(templateContent, aggregated);
  fs.writeFileSync(outputPath, rendered, 'utf8');

  console.log(`Markdown generated at: ${outputPath}`);
  if (warnings.length) {
    console.warn('Warnings:');
    warnings.forEach((w) => console.warn(` - ${w}`));
  }
}

main();
