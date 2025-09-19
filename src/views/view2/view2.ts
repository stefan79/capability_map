import * as d3 from 'd3';

import { View } from '../view';
import { View2Model } from './model';

export class View2 implements View {
  private container: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  constructor(containerId: string) {
    this.container = d3.select(`#${containerId}`);
    this.tooltip = d3.select<HTMLDivElement, unknown>('#tooltip');
  }

  render(data: View2Model[]): void {
    this.unmount(); // Clear previous render

    const svg = this.container.append('svg')
      .attr('width', 500)
      .attr('height', 300);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, 500])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount) || 0])
      .range([300, 0]);

    const bars = svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.category)!)
      .attr('width', xScale.bandwidth())
      .attr('fill', 'coral')
      .attr('y', 300) // Start at the bottom
      .attr('height', 0); // Start with zero height

    bars.on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 0.9);
        this.tooltip.html(`Category: ${d.category}<br/>Amount: ${d.amount}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(500).style('opacity', 0);
      });

    bars.transition()
      .duration(750)
      .attr('y', d => yScale(d.amount))
      .attr('height', d => 300 - yScale(d.amount));
  }

  unmount(): void {
    this.container.selectAll('*').remove();
  }
}
