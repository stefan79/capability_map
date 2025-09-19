import * as d3 from 'd3';

import { View } from '../view';
import { Capability, Cluster, isCluster } from './model';

export class CapabilityView implements View {
  private hideTooltipTimeout: number | null = null;
  private container: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  constructor(containerId: string) {
    this.container = d3.select(`#${containerId}`);
    this.tooltip = d3.select<HTMLDivElement, unknown>('#tooltip');
  }

  render(data: Cluster): void {
    this.unmount();

    const width = 1600;
    const self = this;

    const root = d3.hierarchy<Cluster | Capability>(data);

    // Define fixed sizes and paddings
    const capabilityWidth = 200;
    const capabilityHeight = 50; // Increased height for two lines
    const capabilityPadding = 8;
    const clusterTitleHeight = 30;
    const clusterPadding = 10;

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

    const statusColor = d3.scaleOrdinal<string>()
      .domain(['implemented', 'partially', 'not implemented'])
      .range(['#5CB85C', '#FFBF00', '#D9534F']);

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

    const ICON_TECHNOLOGY = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="24px" height="24px" viewBox="0 0 24 24" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><g transform="translate(0 -1028.4)"><path d="m16 1030.4v1c-0.312 0.1-0.617 0.2-0.875 0.4l-0.75-0.8-0.719 0.7 0.75 0.8c-0.168 0.2-0.28 0.6-0.344 0.9h-1.062v1h1.062c0.064 0.3 0.176 0.6 0.344 0.8l-0.75 0.8 0.719 0.7 0.75-0.7c0.258 0.1 0.563 0.2 0.875 0.3v1.1h1v-1.1c0.312-0.1 0.617-0.2 0.875-0.3l0.75 0.7 0.719-0.7-0.75-0.8c0.168-0.2 0.28-0.5 0.344-0.8h1.062v-1h-1.062c-0.064-0.3-0.176-0.7-0.344-0.9l0.75-0.8-0.719-0.7-0.75 0.8c-0.258-0.2-0.563-0.3-0.875-0.4v-1h-1zm0.5 2c0.828 0 1.5 0.6 1.5 1.5 0 0.8-0.672 1.5-1.5 1.5s-1.5-0.7-1.5-1.5c0-0.9 0.672-1.5 1.5-1.5z" fill="#808080"/><path d="m19 1035.3v1.1c-0.27 0-0.534 0.1-0.781 0.2l-0.531-0.9-0.876 0.5 0.532 0.9c-0.224 0.2-0.419 0.4-0.594 0.6l-0.906-0.6-0.5 0.9 0.906 0.5c-0.096 0.3-0.181 0.6-0.219 0.8h-1.031v1h1.031c0.038 0.3 0.123 0.6 0.219 0.8l-0.906 0.5 0.5 0.9 0.906-0.5c0.175 0.2 0.37 0.4 0.594 0.6l-0.532 0.9 0.876 0.5 0.531-0.9c0.247 0.1 0.511 0.2 0.781 0.2v1h1v-1c0.27 0 0.534-0.1 0.781-0.2l0.531 0.9 0.876-0.5-0.532-0.9c0.224-0.2 0.419-0.4 0.594-0.6l0.906 0.5 0.5-0.9-0.906-0.5c0.096-0.2 0.181-0.5 0.219-0.8h1.031v-1h-1.031c-0.038-0.2-0.123-0.5-0.219-0.8l0.906-0.5-0.5-0.9-0.906 0.6c-0.175-0.2-0.37-0.4-0.594-0.6l0.532-0.9-0.876-0.5-0.531 0.9c-0.247-0.1-0.511-0.2-0.781-0.2v-1.1h-1zm0.5 2c1.381 0 2.5 1.2 2.5 2.5 0 1.4-1.119 2.5-2.5 2.5s-2.5-1.1-2.5-2.5c0-1.3 1.119-2.5 2.5-2.5z" fill="#808080"/><path d="m10 1033.3-2.0312 0.1v2.1c-0.3602 0-0.712 0.1-1.0626 0.2l-1.0624-1.8-1.7188 1 1.0312 1.8c-0.2891 0.3-0.5468 0.5-0.7812 0.8l-1.8125-1-1 1.7 1.8125 1.1c-0.1343 0.3-0.2489 0.7-0.3125 1.1h-2.0938l0.00005 2h2.125c0.0627 0.4 0.1498 0.7 0.2812 1.1l-1.8125 1 1 1.7 1.8125-1c0.2379 0.3 0.5008 0.5 0.7812 0.8l-1.0624 1.8 1.75 1 1.0312-1.8c0.3599 0.1 0.7461 0.2 1.125 0.3v2.1h2v-2.1c0.36-0.1 0.712-0.2 1.062-0.3l1.063 1.8 1.719-1-1.032-1.8c0.29-0.3 0.547-0.5 0.782-0.8l1.812 1 1.032-1.7-1.844-1c0.134-0.4 0.249-0.8 0.312-1.1h2.094v-2.1h-2.125c-0.063-0.3-0.15-0.7-0.281-1l1.812-1.1-1-1.7-1.812 1c-0.238-0.2-0.501-0.5-0.782-0.7l1.063-1.9-1.75-1-1.031 1.8c-0.36-0.1-0.746-0.2-1.1252-0.2l0.0312-2.2zm-1 5.1c1.657 0 3 1.3 3 3 0 1.6-1.343 3-3 3-1.6569 0-3-1.4-3-3 0-1.7 1.3431-3 3-3z" fill="#808080"/></g></svg>`;
    const ICON_PATTERN = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 326.207 326.207" xml:space="preserve"><g><g><path style="fill:#808080;" d="M318.707,40.524H7.5c-4.142,0-7.5,3.357-7.5,7.5v230.158c0,4.143,3.358,7.5,7.5,7.5h311.207c4.142,0,7.5-3.357,7.5-7.5V48.024C326.207,43.882,322.849,40.524,318.707,40.524z M311.207,270.683H15V55.524h296.207V270.683z"/><path style="fill:#808080;" d="M37.5,255.684h107.1c4.142,0,7.5-3.357,7.5-7.5V78.024c0-4.143-3.358-7.5-7.5-7.5h-20.946c-4.142,0-7.5,3.357-7.5,7.5s3.358,7.5,7.5,7.5H137.1v49.133H91.05c-4.142,0-7.5,3.357-7.5,7.5c0,4.143,3.358,7.5,7.5,7.5h46.05v40.175h-15.103c-4.142,0-7.5,3.357-7.5,7.5s3.358,7.5,7.5,7.5H137.1v35.852H98.55v-43.352c0-4.143-3.358-7.5-7.5-7.5c-4.142,0-7.5,3.357-7.5,7.5v43.352H45v-35.852h15.104c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H45V85.524h47.708c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H37.5c-4.142,0-7.5,3.357-7.5,7.5v170.159C30,252.326,33.358,255.684,37.5,255.684z"/><path style="fill:#808080;" d="M184.202,151.577h104.505c4.142,0,7.5-3.357,7.5-7.5V78.024c0-4.143-3.358-7.5-7.5-7.5H184.202c-4.142,0-7.5,3.357-7.5,7.5v66.053C176.702,148.22,180.06,151.577,184.202,151.577z M191.702,85.524h89.505v51.053h-89.505V85.524z"/><path style="fill:#808080;" d="M184.202,174.832h104.505c4.142,0,7.5-3.357,7.5-7.5s-3.358-7.5-7.5-7.5H184.202c-4.142,0-7.5,3.357-7.5,7.5S180.06,174.832,184.202,174.832z"/><path style="fill:#808080;" d="M184.202,201.782h84.568c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-84.568c-4.142,0-7.5,3.357-7.5,7.5C176.702,198.425,180.06,201.782,184.202,201.782z"/><path style="fill:#808080;" d="M184.202,255.684h52.253c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-52.253c-4.142,0-7.5,3.357-7.5,7.5C176.702,252.326,180.06,255.684,184.202,255.684z"/><path style="fill:#808080;" d="M184.202,228.733h84.568c4.142,0,7.5-3.357,7.5-7.5c0-4.143-3.358-7.5-7.5-7.5h-84.568c-4.142,0-7.5,3.357-7.5,7.5C176.702,225.376,180.06,228.733,184.202,228.733z"/></g></g></svg>`;
    const ICON_POLICY = `<?xml version='1.0' encoding='iso-8859-1'?><svg fill="#808080" height="24px" width="24px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.783 237.783" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 237.783 237.783"><g><path d="m42.735,50.071h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.934h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.935h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6zm0,25.935h96.959c3.313,0 6,2.687 6,6s-2.687,6-6,6h-96.959c-3.313,0-6-2.687-6-6s2.686-6 6-6z"/><path d="m237.783,98.361c0-1.591-0.632-3.117-1.757-4.243l-16.356-16.355c-1.125-1.125-2.651-1.757-4.243-1.757s-3.117,0.632-4.243,1.757l-28.756,28.756v-88.117c0-3.313-2.686-6-6-6h-170.428c-3.314,0-6,2.687-6,6v200.979c0,3.313 2.686,6 6,6h170.429c3.314,0 6-2.687 6-6v-63.18l53.597-53.597c1.125-1.125 1.757-2.651 1.757-4.243zm-225.783,115.02v-188.979h158.429v94.117l-35.291,35.291h-92.403c-3.313,0-6,2.687-6,6s2.687,6 6,6h80.403l-1.033,1.033c-0.777,0.777-1.326,1.753-1.586,2.821l-4.157,17.05h-25.148c-3.313,0-6,2.687-6,6s2.687,6 6,6c0,0 29.714,0 29.86,0 0.473,0 0.95-0.056 1.421-0.171l21.629-5.273c1.068-0.26 2.044-0.809 2.821-1.586l23.482-23.482v45.181h-158.427zm127.649-31.374l-10.408,2.538 2.538-10.408 83.648-83.648 7.871,7.871-83.649,83.647z"/></g></svg>`;

    capabilityNodes.append('rect')
      .attr('class', 'main-rect')
      .attr('width', capabilityWidth)
      .attr('height', capabilityHeight);

    capabilityNodes.append('rect')
      .attr('class', 'status-bar')
      .attr('width', 5)
      .attr('height', capabilityHeight)
      .attr('fill', d => statusColor((d.data as Capability).status));

    capabilityNodes.append('foreignObject')
      .attr('x', 10)
      .attr('y', 13)
      .attr('width', 24)
      .attr('height', 24)
      .html(d => {
        const type = (d.data as Capability).type;
        if (type === 'technology') return ICON_TECHNOLOGY;
        if (type === 'pattern') return ICON_PATTERN;
        if (type === 'policy') return ICON_POLICY;
        return '';
      });

    capabilityNodes.append('foreignObject')
      .attr('x', 40)
      .attr('y', 0)
      .attr('width', capabilityWidth - 45)
      .attr('height', capabilityHeight)
      .append('xhtml:div')
      .attr('class', 'treemap-capability-title-wrapper')
      .html(d => `<div class="treemap-capability-title">${d.data.title || ''}</div>`);

    capabilityNodes.on('mouseover', (event, d) => {
        if (self.hideTooltipTimeout) {
          clearTimeout(self.hideTooltipTimeout);
          self.hideTooltipTimeout = null;
        }

        self.tooltip.classed('visible', true);

        const capability = d.data as Capability;
        const tooltipHtml = `
          <div class="tooltip-content">
            <div class="tooltip-title">${capability.title}</div>
            <div class="tooltip-description">${capability.description}</div>
            <table class="tooltip-details">
              <tr>
                <td>Status:</td>
                <td>${capability.status}</td>
              </tr>
              <tr>
                <td>Type:</td>
                <td>${capability.type}</td>
              </tr>
            </table>
            <div class="tooltip-section">
              <div class="tooltip-section-title">Implemented in:</div>
              <ul>
                <li>GenAI Hub</li>
              </ul>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-section-title">HVIA:</div>
              <ul>
                <li>SOPS / Material management</li>
              </ul>
            </div>
          </div>
        `;
        self.tooltip.html(tooltipHtml)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
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
}
