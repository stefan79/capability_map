import * as d3 from 'd3';

import type { HVIA } from '../../data/hvias-model';
import { getMaturityBandColor, lightenHexColor,MATURITY_DIMENSIONS, MAX_MATURITY_LEVEL } from '../../data/maturity-config';
import type { CapabilityMaturitySummary } from '../../data/maturity-types';
import { View } from '../view';
import { Capability, Cluster, isCluster } from './model';

type CapabilityTreeRoot = {
  id?: string;
  title?: string;
  description?: string;
  foundational?: boolean;
  children: (Cluster | Capability)[];
  imports?: string[];
};

type CapabilityViewData = {
  root: CapabilityTreeRoot;
  hvias: HVIA[];
};

type Rgb = [number, number, number];
type Point = { x: number; y: number };

const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  if (Number.isNaN(value)) return [0, 0, 0];
  if (normalized.length === 3) {
    const r = ((value >> 8) & 0xf) * 17;
    const g = ((value >> 4) & 0xf) * 17;
    const b = (value & 0xf) * 17;
    return [r, g, b];
  }
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return [r, g, b];
};

const darkenHexColor = (hex: string, amount = 0.2): string => {
  const [r, g, b] = hexToRgb(hex);
  const clamp = (channel: number) => Math.max(0, Math.min(255, channel * (1 - amount)));
  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
};

const getReadableTextColor = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1A1F2E' : '#FFFFFF';
};

const RADAR_SIZE = 220;
const RADAR_RADIUS = RADAR_SIZE / 2 - 28;
const RADAR_CENTER = RADAR_SIZE / 2;
const TWO_PI = Math.PI * 2;
const RADAR_ANGLE_OFFSET = -Math.PI / 2;
const clampMaturityValue = (value?: number): number => Math.max(0, Math.min(MAX_MATURITY_LEVEL, value ?? 0));
const valueToRadius = (value: number): number => (RADAR_RADIUS * value) / MAX_MATURITY_LEVEL;

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle),
});

const describeSegmentPath = (radius: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(RADAR_CENTER, RADAR_CENTER, radius, startAngle);
  const end = polarToCartesian(RADAR_CENTER, RADAR_CENTER, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${RADAR_CENTER} ${RADAR_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

const describeArc = (radius: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(RADAR_CENTER, RADAR_CENTER, radius, startAngle);
  const end = polarToCartesian(RADAR_CENTER, RADAR_CENTER, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const renderDimensionIcon = (iconPath: string, color: string): string => {
  const iconSize = 18;
  const scale = iconSize / 24;
  return `<g transform="translate(-${iconSize / 2}, -${iconSize / 2}) scale(${scale})"><path d="${iconPath}" fill="${color}" /></g>`;
};

const buildBlobPath = (() => {
  const lineGenerator = d3
    .line<Point>()
    .x((point) => point.x)
    .y((point) => point.y)
    .curve(d3.curveCatmullRomClosed.alpha(0.5));
  // Centripetal Catmull-Rom keeps the blob rounded without self-intersections.
  return (points: Point[]): string => {
    if (points.length === 0) {
      return `M ${RADAR_CENTER} ${RADAR_CENTER} Z`;
    }
    if (points.length === 1) {
      const [point] = points;
      return `M ${point.x} ${point.y} Z`;
    }
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} Z`;
    }
    return lineGenerator(points) ?? `M ${RADAR_CENTER} ${RADAR_CENTER} Z`;
  };
})();

const buildRadarSvg = (summary: CapabilityMaturitySummary): string => {
  const segments: string[] = [];
  const arcs: string[] = [];
  const icons: string[] = [];
  const labels: string[] = [];

  const dimCount = MATURITY_DIMENSIONS.length || 1;
  const step = TWO_PI / dimCount;

  const polygonPoints: Point[] = [];
  MATURITY_DIMENSIONS.forEach((dimension, index) => {
    const dimensionSummary = summary.dimensions[dimension.id];
    const startAngle = RADAR_ANGLE_OFFSET + index * step;
    const definitionIds = dimension.subdimensions.map((subdefinition) => subdefinition.id);
    const summaryIds = Object.keys(dimensionSummary?.subdimensions ?? {});
    const orderedSubIds = definitionIds.concat(summaryIds.filter((id) => !definitionIds.includes(id)));
    if (orderedSubIds.length === 0) {
      const value = clampMaturityValue(dimensionSummary?.value);
      const angle = startAngle + step / 2;
      polygonPoints.push(polarToCartesian(RADAR_CENTER, RADAR_CENTER, valueToRadius(value), angle));
      return;
    }
    const subStep = step / orderedSubIds.length;
    orderedSubIds.forEach((subId, subIndex) => {
      const subSummary = dimensionSummary?.subdimensions[subId];
      const value = clampMaturityValue(subSummary?.value);
      const angle = startAngle + subIndex * subStep + subStep / 2;
      polygonPoints.push(polarToCartesian(RADAR_CENTER, RADAR_CENTER, valueToRadius(value), angle));
    });
  });

  const blobPath = buildBlobPath(polygonPoints);

  MATURITY_DIMENSIONS.forEach((dimension, index) => {
    const dimensionSummary = summary.dimensions[dimension.id];
    const startAngle = RADAR_ANGLE_OFFSET + index * step;
    const endAngle = startAngle + step;
    const segmentFill = lightenHexColor(dimension.color, 0.55);
    segments.push(`<path class="radar-segment" d="${describeSegmentPath(RADAR_RADIUS, startAngle, endAngle)}" fill="${segmentFill}" />`);

    const dimensionValue = clampMaturityValue(dimensionSummary?.value);
    const dimensionArcRadius = valueToRadius(dimensionValue);
    if (dimensionArcRadius > 0 && dimensionValue > 0) {
      arcs.push(`<path class="radar-arc radar-arc--average" d="${describeArc(dimensionArcRadius, startAngle, endAngle)}" stroke="${dimension.color}" />`);
    }

    const iconAngle = startAngle + step / 2;
    const iconPosition = polarToCartesian(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS - 24, iconAngle);
    icons.push(`<g class="radar-icon" transform="translate(${iconPosition.x}, ${iconPosition.y})">${renderDimensionIcon(dimension.iconPath, dimension.color)}</g>`);

    const labelPosition = polarToCartesian(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS + 18, iconAngle);
    labels.push(`<text class="radar-label" x="${labelPosition.x}" y="${labelPosition.y}" fill="${dimension.color}" text-anchor="middle" dominant-baseline="middle">${dimension.name}</text>`);
  });

  return `
    <svg class="maturity-radar-svg" width="${RADAR_SIZE}" height="${RADAR_SIZE}" viewBox="0 0 ${RADAR_SIZE} ${RADAR_SIZE}">
      ${segments.join('')}
      <path class="radar-blob" d="${blobPath}" />
      ${arcs.join('')}
      ${icons.join('')}
      ${labels.join('')}
    </svg>
  `;
};

const buildMaturitySection = (summary?: CapabilityMaturitySummary): string => {
  if (!summary || summary.total <= 0) return '';
  const radarSvg = buildRadarSvg(summary);
  const legendItems = MATURITY_DIMENSIONS.map((dimension) => {
    const dimensionSummary = summary.dimensions[dimension.id];
    if (!dimensionSummary) return '';
    const iconBackground = lightenHexColor(dimension.color, 0.8);
    const subList = Object.values(dimensionSummary.subdimensions)
      .map(
        (sub) => `
          <li>
            <span class="sub-name">${sub.name}</span>
            <span class="sub-value">${sub.value.toFixed(1)}</span>
          </li>
        `
      )
      .join('');

    return `
      <li>
        <div class="legend-header">
          <span class="legend-icon" style="color:${dimension.color};background:${iconBackground}">
            <svg viewBox="${dimension.iconViewBox}" width="18" height="18" aria-hidden="true">
              <path d="${dimension.iconPath}" fill="currentColor" />
            </svg>
          </span>
          <span class="legend-name">${dimension.name}</span>
          <span class="legend-value">${dimensionSummary.value.toFixed(1)} / ${MAX_MATURITY_LEVEL}</span>
        </div>
        <ul class="legend-sublist">
          ${subList}
        </ul>
      </li>
    `;
  }).join('');

  return `
    <div class="tooltip-section maturity-section">
      <div class="tooltip-section-title">Maturity (${summary.total.toFixed(1)} / ${MAX_MATURITY_LEVEL})</div>
      <div class="maturity-radar-wrapper">
        ${radarSvg}
      </div>
      <ul class="maturity-legend">
        ${legendItems}
      </ul>
    </div>
  `;
};

const buildProductSection = (product?: Capability['product']): string => {
  if (!product) return '';
  const teamLink = product.teamName
    ? (product.teamLink
        ? `<a href="${product.teamLink}" target="_blank" rel="noopener noreferrer">${product.teamName}</a>`
        : `<span>${product.teamName}</span>`)
    : '';

  const buildContact = (label: string, contact?: { name: string; email: string }): string => {
    if (!contact?.name) return '';
    const link = contact.email
      ? `<a href="mailto:${contact.email}">${contact.name}</a>`
      : contact.name;
    return `<li><span class="contact-label">${label}:</span> ${link}</li>`;
  };

  const contacts = [buildContact('DPO', product.dpo), buildContact('SA', product.sa)].filter(Boolean).join('');
  const contactsList = contacts ? `<ul class="product-team-contacts">${contacts}</ul>` : '';
  const description = product.description ? `<div class="product-team-description">${product.description}</div>` : '';

  return `
    <div class="tooltip-section product-section">
      <div class="tooltip-section-title">Product Team</div>
      <div class="product-team-name">
        <span class="product-name">${product.name}</span>
        ${teamLink ? `<span class="team-link">${teamLink}</span>` : ''}
      </div>
      ${description}
      ${contactsList}
    </div>
  `;
};
export class CapabilityView implements View {
  private hideTooltipTimeout: number | null = null;
  private container: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  private currentData: CapabilityViewData | null = null;
  private selectedHviaId = 'all';
  private hviaIndex: Record<string, HVIA> = {};

  constructor(containerId: string) {
    this.container = d3.select(`#${containerId}`);
    this.tooltip = d3.select<HTMLDivElement, unknown>('#tooltip');
  }

  render(payload: CapabilityViewData): void {
    this.unmount();

    this.currentData = payload;
    this.hviaIndex = {};
    payload.hvias.forEach((hvia) => {
      this.hviaIndex[hvia.id] = hvia;
    });
    if (this.selectedHviaId !== 'all' && !this.hviaIndex[this.selectedHviaId]) {
      this.selectedHviaId = 'all';
    }

    const data = payload.root;
    const hvias = payload.hvias;

    const width = 1600;
    const self = this;

    this.renderFilterControls(hvias);

    const root = d3.hierarchy<Cluster | Capability>(data as Cluster);

    const hviaSelected = this.selectedHviaId !== 'all';
    const selectedHviaName = hviaSelected ? (this.hviaIndex[this.selectedHviaId]?.name ?? this.selectedHviaId) : '';

    const hviaLabelMap: Record<number, string> = {
      0: 'Not Started',
      1: 'Requested by HVIA',
      2: 'In Use by HVIA',
      3: 'Established by HVIA',
    };
    const hviaListLabelMap: Record<number, string> = {
      0: 'not started',
      1: 'requested',
      2: 'in use',
      3: 'established',
    };


    type CapabilityVisualState = {
      tileFill: string;
      tileStroke: string;
      textColor: string;
      secondaryTextColor: string;
      iconColor: string;
      hviaLinked: boolean;
      hviaStatusLabel: string;
      hviaTooltipLabel: string;
      hviaStatusLevel: number;
      opacity: number;
      totalMaturity: number;
      zeroMaturity: boolean;
    };
    const computeVisualState = (cap: Capability): CapabilityVisualState => {
      const total = cap.maturity?.total ?? 0;
      const tileFill = total > 0 ? getMaturityBandColor(total) : '#EFF1F4';
      const textColor = getReadableTextColor(tileFill);
      const secondaryTextColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : '#2F3A45';

      let hviaLinked = true;
      let hviaStatusLabel = '';
      let hviaTooltipLabel = '';
      let hviaStatusLevel = -1;
      let opacity = 1;

      if (hviaSelected) {
        const hviaId = self.selectedHviaId;
        const match = (cap.useCases ?? []).find((uc) => uc.hviaId === hviaId);
        if (match) {
          hviaStatusLevel = Math.max(0, Math.min(3, match.maturity));
          hviaStatusLabel = hviaLabelMap[hviaStatusLevel] ?? '';
          hviaTooltipLabel = hviaStatusLabel + (selectedHviaName ? ` — ${selectedHviaName}` : '');
        } else {
          hviaLinked = false;
          hviaStatusLabel = 'Not linked';
          hviaTooltipLabel = selectedHviaName ? `Not linked to ${selectedHviaName}` : 'Not linked to selected HVIA';
          opacity = 0.45;
        }
      }

      return {
        tileFill,
        tileStroke: total > 0 ? darkenHexColor(tileFill, 0.35) : '#CFD3DA',
        textColor,
        secondaryTextColor,
        iconColor: textColor,
        hviaLinked,
        hviaStatusLabel,
        hviaTooltipLabel,
        hviaStatusLevel,
        opacity,
        totalMaturity: total,
        zeroMaturity: total <= 0,
      };
    };

    // Define fixed sizes and paddings
    const capabilityWidth = 200;
    const capabilityHeight = 50; // Keep current tile size as reference
    const capabilityPadding = 8;
    const clusterTitleHeight = 30;
    const clusterPadding = 10;
    const iconPaddingLeft = 8;
    const iconSize = 24;
    const contentStartX = iconPaddingLeft + iconSize + 8;

    // Custom layout function using two passes: 1. calculate sizes, 2. set positions
    function calculateSizes(node: d3.HierarchyNode<Cluster | Capability>) {
      if (!isCluster(node.data) || !node.children) {
        (node as any).width = capabilityWidth;
        (node as any).height = capabilityHeight;
        return;
      }

      node.children.forEach(calculateSizes);

      const capabilities = node.children.filter(c => !isCluster(c.data));
      const clusters = node.children.filter(c => isCluster(c.data));
      const regularClusters = clusters.filter(c => !(c.data as Cluster).foundational);
      const foundationalClusters = clusters.filter(c => (c.data as Cluster).foundational);

      let requiredWidth = 0;
      let requiredHeight = clusterTitleHeight;

      if (capabilities.length > 0) {
        const isFoundational = (node.data as Cluster).foundational;
        const cols = isFoundational ? 6 : (capabilities.length > 5 ? 2 : 1);
        const rows = Math.ceil(capabilities.length / cols);
        requiredWidth = Math.max(requiredWidth, cols * capabilityWidth + (cols - 1) * capabilityPadding);
        if (rows > 0) {
          requiredHeight += rows * capabilityHeight + (rows - 1) * capabilityPadding;
        }
      }

      if (regularClusters.length > 0) {
        if (capabilities.length > 0) requiredHeight += clusterPadding;

        const clusterCols = node.depth === 0 ? 3 : 2;
        const rows: d3.HierarchyNode<Cluster | Capability>[][] = [];
        // Special grouping for non-top-level clusters to isolate large ones
        if (node.depth > 0) {
          let i = 0;
          while (i < regularClusters.length) {
            const cluster1 = regularClusters[i];
            const caps1 = cluster1.children?.filter(c => !isCluster(c.data)) || [];
            if (caps1.length > 5) {
              rows.push([cluster1]);
              i++;
              continue;
            }
            if (i + 1 < regularClusters.length) {
              const cluster2 = regularClusters[i + 1];
              const caps2 = cluster2.children?.filter(c => !isCluster(c.data)) || [];
              if (caps2.length > 5) {
                rows.push([cluster1]);
                i++;
                continue;
              }
              rows.push([cluster1, cluster2]);
              i += 2;
            } else {
              rows.push([cluster1]);
              i++;
            }
          }
        } else {
          for (let i = 0; i < regularClusters.length; i += clusterCols) {
            rows.push(regularClusters.slice(i, i + clusterCols));
          }
        }

        let maxRowWidth = 0;
        let regularClustersHeight = 0;
        rows.forEach(row => {
          const rowWidth = row.reduce((sum, child) => sum + (child as any).width, 0) + (row.length - 1) * clusterPadding;
          maxRowWidth = Math.max(maxRowWidth, rowWidth);
          const maxChildHeight = Math.max(...row.map(child => (child as any).height));
          regularClustersHeight += maxChildHeight + clusterPadding;
        });
        requiredWidth = Math.max(requiredWidth, maxRowWidth);
        if (rows.length > 0) {
          requiredHeight += regularClustersHeight - clusterPadding;
        }
      }

      const contentWidth = requiredWidth;

      if (foundationalClusters.length > 0) {
        if (capabilities.length > 0 || regularClusters.length > 0) requiredHeight += clusterPadding;
        
        foundationalClusters.forEach(cluster => {
          (cluster as any).width = contentWidth;
          requiredHeight += (cluster as any).height + clusterPadding;
        });
        requiredHeight -= clusterPadding;
      }

      (node as any).width = requiredWidth + 2 * clusterPadding;
      (node as any).height = requiredHeight + clusterPadding;
    }

    function setPositions(node: d3.HierarchyNode<Cluster | Capability>, x0: number, y0: number) {
      (node as any).x = x0;
      (node as any).y = y0;

      if (!isCluster(node.data) || !node.children) return;

      let y_cursor = y0 + clusterTitleHeight;
      const content_x = x0 + clusterPadding;
      const content_width = (node as any).width - 2 * clusterPadding;

      const capabilities = node.children.filter(c => !isCluster(c.data));
      const clusters = node.children.filter(c => isCluster(c.data));
      const regularClusters = clusters.filter(c => !(c.data as Cluster).foundational);
      const foundationalClusters = clusters.filter(c => (c.data as Cluster).foundational);

      if (capabilities.length > 0) {
        const isFoundational = (node.data as Cluster).foundational;
        const cols = isFoundational ? 6 : (capabilities.length > 5 ? 2 : 1);
        capabilities.forEach((cap, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const cx = content_x + col * (capabilityWidth + capabilityPadding);
          const cy = y_cursor + row * (capabilityHeight + capabilityPadding);
          setPositions(cap, cx, cy);
        });
        const rows = Math.ceil(capabilities.length / cols);
        if (rows > 0) {
          y_cursor += rows * capabilityHeight + (rows - 1) * capabilityPadding;
        }
      }

      if (regularClusters.length > 0) {
        if (capabilities.length > 0) y_cursor += clusterPadding;
        const clusterCols = node.depth === 0 ? 3 : 2;
        const rows: d3.HierarchyNode<Cluster | Capability>[][] = [];
        if (node.depth > 0) {
          let i = 0;
          while (i < regularClusters.length) {
            const cluster1 = regularClusters[i];
            const caps1 = cluster1.children?.filter(c => !isCluster(c.data)) || [];
            if (caps1.length > 5) { rows.push([cluster1]); i++; continue; }
            if (i + 1 < regularClusters.length) {
              const cluster2 = regularClusters[i + 1];
              const caps2 = cluster2.children?.filter(c => !isCluster(c.data)) || [];
              if (caps2.length > 5) { rows.push([cluster1]); i++; continue; }
              rows.push([cluster1, cluster2]);
              i += 2;
            } else { rows.push([cluster1]); i++; }
          }
        } else {
          for (let i = 0; i < regularClusters.length; i += clusterCols) {
            rows.push(regularClusters.slice(i, i + clusterCols));
          }
        }

        rows.forEach(row => {
          const maxChildHeight = Math.max(...row.map(child => (child as any).height));
          const totalRowWidth = row.reduce((sum, c) => sum + (c as any).width, 0) + (row.length - 1) * clusterPadding;
          const offset = (content_width - totalRowWidth) / 2;
          let x_cursor = content_x + offset;
          row.forEach(cluster => {
            (cluster as any).height = maxChildHeight;
            setPositions(cluster, x_cursor, y_cursor);
            x_cursor += (cluster as any).width + clusterPadding;
          });
          y_cursor += maxChildHeight + clusterPadding;
        });
      }

      if (foundationalClusters.length > 0) {
        if (capabilities.length > 0 || regularClusters.length > 0) y_cursor += clusterPadding;
        const maxRowWidth = (node as any).width - 2 * clusterPadding;
        foundationalClusters.forEach(cluster => {
          const clusterWidth = (cluster as any).width;
          const offset = (maxRowWidth - clusterWidth) / 2;
          setPositions(cluster, content_x + offset, y_cursor);
          y_cursor += (cluster as any).height + clusterPadding;
        });
      }
    }

    calculateSizes(root);
    (root as any).width = Math.max((root as any).width, width); // Ensure root is at least the minimum width
    setPositions(root, 0, 0);

    const totalHeight = (root as any).height;
    const svg = this.container.append('svg')
      .attr('width', width)
      .attr('height', totalHeight)
      .style('font', '12px sans-serif');

    const nodes = svg.selectAll('g')
      .data(root.descendants())
      .enter().append('g')
      .attr('class', d => isCluster(d.data) ? 'treemap-node treemap-cluster-group' : 'treemap-node treemap-capability')
      .attr('transform', d => `translate(${(d as any).x}, ${(d as any).y})`);

    // Render clusters
    const clusterNodes = nodes.filter('.treemap-cluster-group');
    clusterNodes.append('rect')
      .attr('class', 'treemap-cluster')
      .attr('width', d => (d as any).width)
      .attr('height', d => (d as any).height);

    clusterNodes.append('text')
      .attr('x', 4)
      .attr('y', 18)
      .text(d => d.data.title || '');

    // Render capabilities
    const capabilityNodes = nodes.filter('.treemap-capability');

    capabilityNodes.each(function(d) {
      (d as any).visualState = computeVisualState(d.data as Capability);
    });

    capabilityNodes
      .style('opacity', d => {
        const state = ((d as any).visualState as CapabilityVisualState);
        return state ? String(state.opacity) : '1';
      })
      .classed('hvia-unlinked', d => {
        const state = ((d as any).visualState as CapabilityVisualState);
        return state ? !state.hviaLinked : false;
      });

    const ICON_TECHNOLOGY = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="24px" height="24px" viewBox="0 0 24 24" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><g transform="translate(0 -1028.4)"><path d="m16 1030.4v1c-0.312 0.1-0.617 0.2-0.875 0.4l-0.75-0.8-0.719 0.7 0.75 0.8c-0.168 0.2-0.28 0.6-0.344 0.9h-1.062v1h1.062c0.064 0.3 0.176 0.6 0.344 0.8l-0.75 0.8 0.719 0.7 0.75-0.7c0.258 0.1 0.563 0.2 0.875 0.3v1.1h1v-1.1c0.312-0.1 0.617-0.2 0.875-0.3l0.75 0.7 0.719-0.7-0.75-0.8c0.168-0.2 0.28-0.5 0.344-0.8h1.062v-1h-1.062c-0.064-0.3-0.176-0.7-0.344-0.9l0.75-0.8-0.719-0.7-0.75 0.8c-0.258-0.2-0.563-0.3-0.875-0.4v-1h-1zm0.5 2c0.828 0 1.5 0.6 1.5 1.5 0 0.8-0.672 1.5-1.5 1.5s-1.5-0.7-1.5-1.5c0-0.9 0.672-1.5 1.5-1.5z" fill="#808080"/><path d="m19 1035.3v1.1c-0.27 0-0.534 0.1-0.781 0.2l-0.531-0.9-0.876 0.5 0.532 0.9c-0.224 0.2-0.419 0.4-0.594 0.6l-0.906-0.6-0.5 0.9 0.906 0.5c-0.096 0.3-0.181 0.6-0.219 0.8h-1.031v1h1.031c0.038 0.3 0.123 0.6 0.219 0.8l-0.906 0.5 0.5 0.9 0.906-0.5c0.175 0.2 0.37 0.4 0.594 0.6l-0.532 0.9 0.876 0.5 0.531-0.9c0.247 0.1 0.511 0.2 0.781 0.2v1h1v-1c0.27 0 0.534-0.1 0.781-0.2l0.531 0.9 0.876-0.5-0.532-0.9c0.224-0.2 0.419-0.4 0.594-0.6l0.906 0.5 0.5-0.9-0.906-0.5c0.096-0.2 0.181-0.5 0.219-0.8h1.031v-1h-1.031c-0.038-0.2-0.123-0.5-0.219-0.8l0.906-0.5-0.5-0.9-0.906 0.6c-0.175-0.2-0.37-0.4-0.594-0.6l0.532-0.9-0.876-0.5-0.531 0.9c-0.247-0.1-0.511-0.2-0.781-0.2v-1.1h-1zm0.5 2c1.381 0 2.5 1.2 2.5 2.5 0 1.4-1.119 2.5-2.5 2.5s-2.5-1.1-2.5-2.5c0-1.3 1.119-2.5 2.5-2.5z" fill="#808080"/><path d="m10 1033.3-2.0312 0.1v2.1c-0.3602 0-0.712 0.1-1.0626 0.2l-1.0624-1.8-1.7188 1 1.0312 1.8c-0.2891 0.3-0.5468 0.5-0.7812 0.8l-1.8125-1-1 1.7 1.8125 1.1c-0.1343 0.3-0.2489 0.7-0.3125 1.1h-2.0938l0.00005 2h2.125c0.0627 0.4 0.1498 0.7 0.2812 1.1l-1.8125 1 1 1.7 1.8125-1c0.2379 0.3 0.5008 0.5 0.7812 0.8l-1.0624 1.8 1.75 1 1.0312-1.8c0.3599 0.1 0.7461 0.2 1.125 0.3v2.1h2v-2.1c0.36-0.1 0.712-0.2 1.062-0.3l1.063 1.8 1.719-1-1.032-1.8c0.29-0.3 0.547-0.5 0.782-0.8l1.812 1 1.032-1.7-1.844-1c0.134-0.4 0.249-0.8 0.312-1.1h2.094v-2.1h-2.125c-0.063-0.3-0.15-0.7-0.281-1l1.812-1.1-1-1.7-1.812 1c-0.238-0.2-0.501-0.5-0.782-0.7l1.063-1.9-1.75-1-1.031 1.8c-0.36-0.1-0.746-0.2-1.1252-0.2l0.0312-2.2zm-1 5.1c1.657 0 3 1.3 3 3 0 1.6-1.343 3-3 3-1.6569 0-3-1.4-3-3 0-1.7 1.3431-3 3-3z" fill="#808080"/></g></svg>`;
    const ICON_PATTERN = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 326.207 326.207" xml:space="preserve"><g><g><path style="fill:#808080;" d="M318.707,40.524H7.5c-4.142,0-7.5,3.357-7.5,7.5v230.158c0,4.143,3.358,7.5,7.5,7.5h311.207c4.142,0,7.5-3.357,7.5-7.5V48.024C326.207,43.882,322.849,40.524,318.707,40.524z M311.207,270.683H15V55.524h296.207V270.683z"/><path style="fill:#808080;" d="M37.5,255.684h107.1c4.142,0,7.5-3.357,7.5-7.5V78.024c0-4.143-3.358-7.5-7.5-7.5h-20.946c-4.142,0-7.5,3.357-7.5,7.5s3.358,7.5,7.5,7.5H137.1v49.133H91.05c-4.142,0-7.5,3.357-7.5,7.5c0,4.143,3.358,7.5,7.5,7.5h46.05v40.175h-15.103c-4.142,0-7.5,3.357-7.5,7.5s3.358,7.5,7.5,7.5H137.1v35.852H98.55v-43.352c0-4.143-3.358-7.5-7.5-7.5c-4.142,0-7.5,3.357-7.5,7.5v43.352H45v-35.852h15.104c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H45V85.524h47.708c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H37.5c-4.142,0-7.5,3.357-7.5,7.5v170.159C30,252.326,33.358,255.684,37.5,255.684z"/><path style="fill:#808080;" d="M184.202,151.577h104.505c4.142,0,7.5-3.357,7.5-7.5V78.024c0-4.143-3.358-7.5-7.5-7.5H184.202c-4.142,0-7.5,3.357-7.5,7.5v66.053C176.702,148.22,180.06,151.577,184.202,151.577z M191.702,85.524h89.505v51.053h-89.505V85.524z"/><path style="fill:#808080;" d="M184.202,174.832h104.505c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H184.202c-4.142,0-7.5,3.357-7.5,7.5S180.06,174.832,184.202,174.832z"/><path style="fill:#808080;" d="M184.202,201.782h84.568c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-84.568c-4.142,0-7.5,3.357-7.5,7.5C176.702,198.425,180.06,201.782,184.202,201.782z"/><path style="fill:#808080;" d="M184.202,255.684h52.253c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-52.253c-4.142,0-7.5,3.357-7.5,7.5C176.702,252.326,180.06,255.684,184.202,255.684z"/><path style="fill:#808080;" d="M184.202,228.733h84.568c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-84.568c-4.142,0-7.5,3.357-7.5,7.5C176.702,225.376,180.06,228.733,184.202,228.733z"/></g></g></svg>`;
    const ICON_POLICY = `<?xml version='1.0' encoding='iso-8859-1'?><svg fill="#808080" height="24px" width="24px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.783 237.783" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 237.783 237.783"><g><path d="m42.735,50.071h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.934h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.935h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.935h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6z"/><path d="m237.783,98.361c0-1.591-0.632-3.117-1.757-4.243l-16.356-16.355c-1.125-1.125-2.651-1.757-4.243-1.757s-3.117,0.632-4.243,1.757l-28.756,28.756v-88.117c0-3.313-2.686-6-6-6h-170.428c-3.314,0-6,2.687-6,6v200.979c0,3.313 2.686,6 6,6h170.429c3.314,0 6-2.687 6-6v-63.18l53.597-53.597c1.125-1.125 1.757-2.651 1.757-4.243zm-225.783,115.02v-188.979h158.429v94.117l-35.291,35.291h-92.403c-3.313,0-6,2.687-6,6s2.687,6 6,6h80.403l-1.033,1.033c-0.777,0.777-1.326,1.753-1.586,2.821l-4.157,17.05h-25.148c-3.313,0-6,2.687-6,6s2.687,6 6,6c0,0 29.714,0 29.86,0 0.473,0 0.95-0.056 1.421-0.171l21.629-5.273c1.068-0.26 2.044-0.809 2.821-1.586l23.482-23.482v45.181h-158.427zm127.649-31.374l-10.408,2.538 2.538-10.408 83.648-83.648 7.871,7.871-83.649,83.647z"/></g></svg>`;

    capabilityNodes.append('rect')
      .attr('class', 'main-rect')
      .attr('width', capabilityWidth)
      .attr('height', capabilityHeight)
      .attr('fill', d => {
        const state = ((d as any).visualState as CapabilityVisualState);
        return state ? state.tileFill : '#EFF1F4';
      })
      .attr('stroke', d => {
        const state = ((d as any).visualState as CapabilityVisualState);
        return state ? state.tileStroke : '#CFD3DA';
      })
      .attr('stroke-width', 1);

    // Icon area: if tool present, show its logo via SVG <image>; otherwise show type icon via foreignObject
    function asUrl(v: any): string | null {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v.href === 'string') return v.href;
      if (typeof v.default === 'string') return v.default;
      return null;
    }
    const iconGroup = capabilityNodes.append('g').attr('class', 'capability-icon');
    iconGroup.each(function(d){
      const g = d3.select(this);
      const cap = d.data as Capability;
      const state = ((d as any).visualState as CapabilityVisualState) ?? null;
      const iconFill = state?.iconColor ?? '#5F6B7A';
      const x = iconPaddingLeft;
      const y = (capabilityHeight - iconSize) / 2;
      const size = iconSize;
      if (cap.tool && cap.tool.logo) {
        const url = asUrl((cap.tool as any).logo);
        if (url) {
          g.append('image')
            .attr('x', x)
            .attr('y', y)
            .attr('width', size)
            .attr('height', size)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('href', url)
            .attr('xlink:href', url);
        }
      } else {
        const icon = (() => {
          const type = cap.type;
          if (type === 'technology') return ICON_TECHNOLOGY;
          if (type === 'pattern') return ICON_PATTERN;
          if (type === 'policy') return ICON_POLICY;
          return '';
        })();
        const container = g.append('g')
          .attr('transform', `translate(${x},${y})`);
        (container.node() as SVGGElement).innerHTML = icon.replace(/#808080/gi, iconFill);
        container.select('svg')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', size)
          .attr('height', size)
          .attr('preserveAspectRatio', 'xMidYMid meet');
      }
    });

    // Helper: wrap SVG text into tspans (maxLines=2) within a given width
    function wrapSvgText(selection: d3.Selection<SVGTextElement, any, any, any>, width: number, maxLines = 2) {
      selection.each(function(d) {
        const textSel = d3.select<SVGTextElement, any>(this);
        const full = ((d.data as Capability).title || '').trim();
        textSel.text(null);
        if (!full) return;

        const words = full.split(/\s+/).filter(Boolean);
        let line: string[] = [];
        let lineNumber = 0;
        const x = +textSel.attr('x');
        const y = +textSel.attr('y');
        const lineHeight = 13; // px
        let tspan = textSel.append('tspan').attr('x', x).attr('y', y).attr('dy', '0');

        for (let i = 0; i < words.length; i++) {
          line.push(words[i]);
          tspan.text(line.join(' '));
          if ((tspan.node()?.getComputedTextLength() || 0) > width) {
            // overflow, move last word to next line
            line.pop();
            tspan.text(line.join(' '));
            line = [words[i]];
            lineNumber++;
            if (lineNumber >= maxLines) {
              // Need to ellipsize previous line
              // Back up to previous tspan and append ellipsis within width
              const ts = textSel.selectAll('tspan').nodes().pop() as SVGTSpanElement;
              if (ts) {
                let txt = ts.textContent || '';
                txt = txt.replace(/\s+$/, '');
                // append ellipsis by trimming characters
                ts.textContent = txt + '…';
                while ((ts.getComputedTextLength() || 0) > width && ts.textContent && ts.textContent.length > 1) {
                  ts.textContent = ts.textContent.slice(0, -2) + '…';
                }
              }
              return; // stop processing words
            }
            tspan = textSel.append('tspan')
              .attr('x', x)
              .attr('y', y)
              .attr('dy', `${lineNumber * lineHeight}px`)
              .text(line.join(' '));
          }
        }
      });
    }

    // Title on first row (top) using pure SVG text (avoid foreignObject for export compatibility)
    const titleWidth = capabilityWidth - contentStartX - 8;
    const titleText = capabilityNodes.append('text')
      .attr('class', 'capability-title-text')
      .attr('x', contentStartX)
      .attr('y', 16)
      .attr('text-anchor', 'start');
    wrapSvgText(titleText as any, titleWidth, 2);
    titleText.each(function(d) {
      const state = ((d as any).visualState as CapabilityVisualState);
      const color = state ? state.textColor : '#4D4D4D';
      const textSel = d3.select(this);
      textSel.attr('fill', color);
      textSel.selectAll('tspan').attr('fill', color);
    });

    // HVIA compound counter (X / Y), aligned to the right within the capability tile
    // Y = number of requested HVIA refs (maturity > 0)
    // X = number of active HVIA refs (maturity > 1)
    const counterGroup = capabilityNodes.append('g')
      .attr('class', 'hvia-counter')
      // position on the second row, right-aligned inside the tile
      .attr('transform', `translate(${capabilityWidth - 6}, 26)`);

    counterGroup.each(function(d){
      const g = d3.select(this);
      const cap = d.data as Capability;
      const useCases = cap.useCases ?? [];
      const state = ((d as any).visualState as CapabilityVisualState);

      if (hviaSelected) {
        const label = state?.hviaStatusLabel || 'Not Linked';
        const linked = state?.hviaLinked ?? false;
        g.append('text')
          .attr('x', 0)
          .attr('y', 14)
          .attr('text-anchor', 'end')
          .attr('fill', state ? state.secondaryTextColor : '#4D4D4D')
          .attr('font-weight', linked ? '700' : '600')
          .text(label);
      } else {
        const yTotal = useCases.filter(uc => (uc as any).maturity > 0).length;
        const xActive = useCases.filter(uc => (uc as any).maturity > 1).length;
        const isZero = yTotal === 0;
        g.append('text')
          .attr('x', 0) // anchor point at the right edge of the tile
          .attr('y', 14)
          .attr('text-anchor', 'end')
          .attr('fill', state ? state.secondaryTextColor : '#4D4D4D')
          .attr('font-weight', isZero ? '600' : '700')
          .text(`${xActive} / ${yTotal}`);
      }
    });

    const positionTooltip = (event: MouseEvent): void => {
      const tooltipNode = self.tooltip.node();
      if (!tooltipNode) return;
      const padding = 12;
      const rect = tooltipNode.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      let left = event.pageX + 16;
      let top = event.pageY - rect.height - 16;

      if (left + rect.width + padding > scrollX + viewportWidth) {
        left = event.pageX - rect.width - 16;
      }
      if (left < scrollX + padding) {
        left = scrollX + padding;
      }

      if (top < scrollY + padding) {
        top = event.pageY + 16;
      }
      const maxTop = scrollY + viewportHeight - rect.height - padding;
      if (top > maxTop) {
        top = maxTop;
      }

      self.tooltip
        .style('left', `${left}px`)
        .style('top', `${top}px`);
    };

    capabilityNodes.on('mouseover', (event, d) => {
        if (self.hideTooltipTimeout) {
          clearTimeout(self.hideTooltipTimeout);
          self.hideTooltipTimeout = null;
        }

        self.tooltip.classed('visible', true);

        const capability = d.data as Capability;
        const tool = capability.tool;
        const product = capability.product;
        const useCases = (capability.useCases ?? []) as any[];
        const state = ((d as any).visualState as CapabilityVisualState) ?? null;
        const hviaTag = hviaSelected && state?.hviaTooltipLabel
          ? `<span class="tooltip-pill">${state.hviaTooltipLabel}</span>`
          : '';

        // Title + description with details link
        const titleHtml = `<div class="tooltip-title">${capability.title}${hviaTag ? ` ${hviaTag}` : ''}</div>`;
        const descLink = capability.link ? ` <a href="${capability.link}" target="_blank" rel="noopener noreferrer">Details</a>` : '';
        const descriptionHtml = capability.description
          ? `<div class="tooltip-description">${capability.description}${descLink}</div>`
          : '';

        // Implementation section (only if a tool is linked)
        let implementationHtml = '';
        if (tool) {
          const vendorHeader = `<div class="vendor-header">${tool.vendorName ? `Implemented with ${tool.vendorName}` : 'Implemented'}</div>`;
          const logoImg = tool.logo ? `<img class="tool-logo" src="${tool.logo}" alt="${tool.name} logo" />` : '';
          const toolTitle = `<div class="tool-title">${logoImg}<span>${tool.name}</span></div>`;
          const toolDescLink = tool.url ? ` <a href="${tool.url}" target="_blank" rel="noopener noreferrer">Details</a>` : '';
          const toolDesc = `<div class="tool-description">${tool.description || ''}${toolDescLink}</div>`;
          implementationHtml = `
            <div class="tooltip-section tooltip-impl">
              ${vendorHeader}
              ${toolTitle}
              ${toolDesc}
            </div>
          `;
        }

        // HVIAS section grouped by HVIA and filtered by maturity > 0; maturity 1 should be greyed
        let hviasHtml = '';
        if (useCases.length) {
          const grouped: Record<string, { name: string; items: any[] }> = {};
          for (const uc of useCases) {
            const maturityValue = (uc as any).maturity ?? 0;
            const includeZero = hviaSelected && uc.hviaId === self.selectedHviaId;
            if (!includeZero && maturityValue <= 0) continue; // skip 0 unless selected HVIA
            const key = uc.hviaId ?? uc.hviaName ?? 'unknown';
            if (!grouped[key]) grouped[key] = { name: uc.hviaName ?? 'HVIA', items: [] };
            grouped[key].items.push(uc);
          }
          const groupBlocks = Object.values(grouped)
            .map(g => {
              if (!g.items.length) return '';
              const isSelectedGroup = hviaSelected && g.items.some((uc) => uc.hviaId === self.selectedHviaId);
              const lis = g.items.map(uc => {
                const maturityValue = (uc as any).maturity ?? 0;
                const classNames = ['hvia-uc'];
                if (maturityValue <= 1) classNames.push('muted');
                if (hviaSelected && uc.hviaId === self.selectedHviaId) classNames.push('selected');
                const label = hviaListLabelMap[maturityValue] ?? 'not started';
                return `<li class="${classNames.join(' ')}"><span class="hvia-uc-label">${label}:</span> ${uc.name}</li>`;
              }).join('');
              return `
                <div class="hvia-group${isSelectedGroup ? ' selected' : ''}">
                  <div class="hvia-group-title">${g.name}</div>
                  <ul class="hvia-list">${lis}</ul>
                </div>
              `;
            })
            .join('');
          if (groupBlocks.trim().length) {
            hviasHtml = `
              <div class="tooltip-section hvias-section">
                <div class="tooltip-section-title">HVIAS</div>
                ${groupBlocks}
              </div>
            `;
          }
        }

        if (hviaSelected && state && !state.hviaLinked) {
          const missingBlock = `
            <div class="tooltip-section hvias-section hvia-selected-empty">
              <div class="tooltip-section-title">${selectedHviaName || 'Selected HVIA'}</div>
              <div class="tooltip-empty">This capability is not linked to the selected HVIA.</div>
            </div>
          `;
          hviasHtml += missingBlock;
        }

        const productHtml = buildProductSection(product);
        const maturityHtml = buildMaturitySection(capability.maturity);

        const tooltipHtml = `
          <div class="tooltip-content">
            ${titleHtml}
            ${descriptionHtml}
            ${implementationHtml}
            ${productHtml}
            ${maturityHtml}
            ${hviasHtml}
          </div>
        `;
        self.tooltip.html(tooltipHtml);
        positionTooltip(event);
      })
      .on('mouseout', () => {
        self.hideTooltipTimeout = window.setTimeout(() => {
          self.tooltip.classed('visible', false);
        }, 300);
      });

    this.tooltip
      .on('mouseover', () => {
        if (self.hideTooltipTimeout) {
          clearTimeout(self.hideTooltipTimeout);
          self.hideTooltipTimeout = null;
        }
      })
      .on('mouseout', () => {
        self.hideTooltipTimeout = window.setTimeout(() => {
          self.tooltip.classed('visible', false);
        }, 300);
      });
  }

  unmount(): void {
    this.container.selectAll('*').remove();
  }

  private renderFilterControls(hvias: HVIA[]): void {
    const controls = this.container.append('div')
      .attr('class', 'capability-controls');

    const selectId = 'capability-view-hvia-select';

    controls.append('label')
      .attr('for', selectId)
      .attr('class', 'capability-controls-label')
      .text('Filter by HVIA');

    const select = controls.append('select')
      .attr('id', selectId)
      .attr('class', 'capability-controls-select');

    select.append('option')
      .attr('value', 'all')
      .text('All HVIAs');

    hvias.forEach((hvia) => {
      select.append('option')
        .attr('value', hvia.id)
        .text(hvia.name);
    });

    select.property('value', this.selectedHviaId);

    select.on('change', (event: Event) => {
      const target = event.target as HTMLSelectElement | null;
      if (!target) return;
      this.selectedHviaId = target.value;
      if (this.currentData) {
        this.render(this.currentData);
      }
    });

    const activeLabel = controls.append('span')
      .attr('class', 'capability-controls-active');

    const selected = this.selectedHviaId;
    if (selected === 'all') {
      activeLabel.text('Showing capabilities across all HVIAs');
    } else {
      const hviaName = this.hviaIndex[selected]?.name ?? selected;
      activeLabel.text(`Showing use cases for ${hviaName}`);
    }
  }
}
