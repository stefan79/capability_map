import * as d3 from 'd3';

import { View } from '../view';
import { View1Model } from './model';

export class View1 implements View {
  private container: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  constructor(containerId: string) {
    this.container = d3.select(`#${containerId}`);
    this.tooltip = d3.select<HTMLDivElement, unknown>('#tooltip');
  }

  render(data: View1Model[]): void {
    this.unmount(); // Clear previous render

    const svg = this.container.append('svg')
      .attr('width', 500)
      .attr('height', 300);

    const bars = svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * 60)
      .attr('width', 50)
      .attr('fill', 'steelblue')
      .attr('y', 300) // Start at the bottom
      .attr('height', 0); // Start with zero height

    bars.on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 0.9);
        this.tooltip.html(`Value: ${d.value}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(500).style('opacity', 0);
      });

    bars.transition()
      .duration(750) // Animation duration in ms
      .attr('y', d => 300 - d.value * 5)
      .attr('height', d => d.value * 5);

    const labels = svg.selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * 60 + 25)
      .attr('text-anchor', 'middle')
      .text(d => d.value)
      .attr('y', 300) // Start at the bottom
      .attr('opacity', 0); // Start invisible

    labels.transition()
      .duration(750)
      .delay(250) // Start after the bars start growing
      .attr('y', d => 300 - d.value * 5 - 5)
      .attr('opacity', 1);
  }

  unmount(): void {
    this.container.selectAll('*').remove();
  }
}
