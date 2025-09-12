import { Component, ElementRef, ViewChild, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface ProsodyData {
  syllables: {
    text: string;
    isLong: boolean;
    confidence: number;
    position: number;
    stress: number;
    mora: number;
  }[];
  lines: {
    pattern: string;
    syllables: any[];
    moraCount: number;
  }[];
}

@Component({
  selector: 'app-prosody-visualizer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <mat-card class="visualizer-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>insights</mat-icon>
          Prozódiai vizualizációk
        </mat-card-title>
        <div class="controls">
          <mat-select [(value)]="visualizationType" (selectionChange)="updateVisualization()">
            <mat-option value="rhythm">Ritmusgráf</mat-option>
            <mat-option value="meter">Versmértékdiagram</mat-option>
            <mat-option value="stress">Hangsúlytérkép</mat-option>
            <mat-option value="flow">Prozódiai folyam</mat-option>
            <mat-option value="3d">3D mintázat</mat-option>
          </mat-select>
          
          <button mat-icon-button (click)="exportVisualization()" matTooltip="Exportálás">
            <mat-icon>download</mat-icon>
          </button>
          
          <button mat-icon-button (click)="toggleAnimation()" matTooltip="Animáció">
            <mat-icon>{{ isAnimating ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
        </div>
      </mat-card-header>
      
      <mat-card-content>
        <div class="visualization-container">
          <svg #visualizationSvg class="main-visualization"></svg>
          <canvas #canvas3d class="canvas-3d" [hidden]="visualizationType !== '3d'"></canvas>
        </div>
        
        <div class="legend" *ngIf="showLegend">
          <div class="legend-item">
            <div class="legend-symbol long"></div>
            <span>Hosszú szótag (–)</span>
          </div>
          <div class="legend-item">
            <div class="legend-symbol short"></div>
            <span>Rövid szótag (∪)</span>
          </div>
          <div class="legend-item">
            <div class="legend-symbol stress"></div>
            <span>Hangsúlyos</span>
          </div>
        </div>
        
        <div class="animation-controls" *ngIf="visualizationType === 'flow'">
          <mat-slider min="0" max="100" step="1">
            <input matSliderThumb [(ngModel)]="animationSpeed">
          </mat-slider>
          <span>Animációs sebesség: {{ animationSpeed }}%</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .visualizer-card {
      margin: 16px 0;
      min-height: 500px;
    }

    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .visualization-container {
      position: relative;
      width: 100%;
      height: 400px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .main-visualization {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .canvas-3d {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .legend {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-symbol {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .legend-symbol.long {
      background: #e74c3c;
    }

    .legend-symbol.short {
      background: #3498db;
    }

    .legend-symbol.stress {
      background: #f39c12;
      border: 2px solid #d35400;
    }

    .animation-controls {
      margin-top: 16px;
      padding: 16px;
      background: #f0f8ff;
      border-radius: 8px;
    }

    .animation-controls span {
      margin-left: 16px;
      font-size: 0.9rem;
      color: #666;
    }

    /* D3 specific styles */
    .syllable-circle {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .syllable-circle:hover {
      stroke-width: 3px;
      filter: drop-shadow(0 0 8px rgba(0,0,0,0.3));
    }

    .rhythm-bar {
      transition: all 0.5s ease;
    }

    .stress-indicator {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }

    .flow-path {
      fill: none;
      stroke-width: 2;
      stroke-dasharray: 5,5;
      animation: dash 2s linear infinite;
    }

    @keyframes dash {
      to { stroke-dashoffset: -10; }
    }

    /* 3D Canvas specific */
    .canvas-3d {
      background: radial-gradient(circle at 50% 50%, #667eea 0%, #764ba2 100%);
    }
  `]
})
export class ProsodyVisualizerComponent implements OnInit, OnChanges {
  @ViewChild('visualizationSvg', { static: true }) svgElement!: ElementRef<SVGElement>;
  @ViewChild('canvas3d', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  @Input() data: ProsodyData | null = null;
  
  visualizationType: 'rhythm' | 'meter' | 'stress' | 'flow' | '3d' = 'rhythm';
  isAnimating = false;
  showLegend = true;
  animationSpeed = 50;
  
  private svg: d3.Selection<SVGElement, unknown, null, undefined> | null = null;
  private width = 0;
  private height = 0;
  private animationTimer: any = null;

  ngOnInit(): void {
    this.initializeSvg();
    if (this.data) {
      this.updateVisualization();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateVisualization();
    }
  }

  private initializeSvg(): void {
    const container = this.svgElement.nativeElement.parentElement!;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    this.svg = d3.select(this.svgElement.nativeElement)
      .attr('width', this.width)
      .attr('height', this.height);
  }

  updateVisualization(): void {
    if (!this.data || !this.svg) return;
    
    // Clear previous visualization
    this.svg.selectAll('*').remove();
    
    switch (this.visualizationType) {
      case 'rhythm':
        this.createRhythmGraph();
        break;
      case 'meter':
        this.createMeterDiagram();
        break;
      case 'stress':
        this.createStressMap();
        break;
      case 'flow':
        this.createProsodyFlow();
        break;
      case '3d':
        this.create3DVisualization();
        break;
    }
  }

  private createRhythmGraph(): void {
    if (!this.data || !this.svg) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = this.width - margin.left - margin.right;
    const chartHeight = this.height - margin.top - margin.bottom;

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, this.data.syllables.length - 1])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 2])
      .range([chartHeight, 0]);

    // Create rhythm bars
    g.selectAll('.rhythm-bar')
      .data(this.data.syllables)
      .enter()
      .append('rect')
      .attr('class', 'rhythm-bar')
      .attr('x', (d, i) => xScale(i) - 10)
      .attr('y', d => yScale(d.isLong ? 2 : 1))
      .attr('width', 20)
      .attr('height', d => chartHeight - yScale(d.isLong ? 2 : 1))
      .attr('fill', d => d.isLong ? '#e74c3c' : '#3498db')
      .attr('opacity', d => d.confidence)
      .on('mouseover', (event, d) => {
        this.showTooltip(event, d);
      })
      .on('mouseout', () => {
        this.hideTooltip();
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(i => this.data!.syllables[i as number]?.text || ''));

    g.append('g')
      .call(d3.axisLeft(yScale).tickValues([1, 2]).tickFormat(d => d === 1 ? 'Rövid' : 'Hosszú'));
  }

  private createMeterDiagram(): void {
    if (!this.data || !this.svg) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 3;

    // Create circular meter pattern
    const angleStep = (2 * Math.PI) / this.data.syllables.length;
    
    this.data.syllables.forEach((syllable, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const circle = this.svg!.append('circle')
        .attr('class', 'syllable-circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', syllable.isLong ? 12 : 8)
        .attr('fill', syllable.isLong ? '#e74c3c' : '#3498db')
        .attr('stroke', syllable.stress > 0.5 ? '#f39c12' : 'white')
        .attr('stroke-width', syllable.stress > 0.5 ? 3 : 1)
        .attr('opacity', syllable.confidence);

      // Add text labels
      this.svg!.append('text')
        .attr('x', x)
        .attr('y', y + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .text(syllable.text);
    });

    // Add connecting lines between syllables
    const line = d3.line<any>()
      .x((d, i) => centerX + Math.cos((i * angleStep) - Math.PI / 2) * radius)
      .y((d, i) => centerY + Math.sin((i * angleStep) - Math.PI / 2) * radius)
      .curve(d3.curveCardinal);

    this.svg.append('path')
      .datum(this.data.syllables)
      .attr('d', line)
      .attr('stroke', '#34495e')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('opacity', 0.5);
  }

  private createStressMap(): void {
    if (!this.data || !this.svg) return;

    const cols = Math.ceil(Math.sqrt(this.data.syllables.length));
    const rows = Math.ceil(this.data.syllables.length / cols);
    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;

    // Create heatmap
    this.data.syllables.forEach((syllable, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Background cell
      this.svg!.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .attr('fill', this.getStressColor(syllable.stress))
        .attr('opacity', syllable.confidence);

      // Syllable length indicator
      const indicatorSize = syllable.isLong ? cellWidth * 0.6 : cellWidth * 0.4;
      this.svg!.append('circle')
        .attr('class', syllable.stress > 0.5 ? 'stress-indicator' : '')
        .attr('cx', x + cellWidth / 2)
        .attr('cy', y + cellHeight / 2)
        .attr('r', indicatorSize / 2)
        .attr('fill', syllable.isLong ? '#e74c3c' : '#3498db')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Text label
      this.svg!.append('text')
        .attr('x', x + cellWidth / 2)
        .attr('y', y + cellHeight / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(syllable.text);
    });
  }

  private createProsodyFlow(): void {
    if (!this.data || !this.svg) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth = this.width - margin.left - margin.right;
    const chartHeight = this.height - margin.top - margin.bottom;

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create flowing path based on prosodic pattern
    const pathData = this.data.syllables.map((syllable, i) => {
      const x = (i / this.data!.syllables.length) * chartWidth;
      const baseY = chartHeight / 2;
      const y = syllable.isLong ? baseY - 40 : baseY + 40;
      return { x, y, syllable, index: i };
    });

    // Create smooth curved path
    const line = d3.line<any>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    g.append('path')
      .datum(pathData)
      .attr('class', 'flow-path')
      .attr('d', line)
      .attr('stroke', '#667eea')
      .attr('stroke-width', 3);

    // Add syllable markers on the path
    g.selectAll('.flow-marker')
      .data(pathData)
      .enter()
      .append('circle')
      .attr('class', 'flow-marker')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.syllable.isLong ? 8 : 6)
      .attr('fill', d => d.syllable.isLong ? '#e74c3c' : '#3498db')
      .attr('stroke', d => d.syllable.stress > 0.5 ? '#f39c12' : 'white')
      .attr('stroke-width', 2);

    // Add animated flowing particles
    if (this.isAnimating) {
      this.startFlowAnimation(g, pathData);
    }
  }

  private create3DVisualization(): void {
    // This would integrate with Three.js for 3D visualization
    // For now, we'll create a placeholder 2D representation
    if (!this.data || !this.svg) return;

    const perspective = 0.6;
    const depth = 100;
    
    this.data.syllables.forEach((syllable, i) => {
      const x = (i / this.data!.syllables.length) * this.width;
      const y = this.height / 2;
      const z = syllable.isLong ? depth : depth / 2;
      
      // Apply 3D perspective transformation
      const perspectiveY = y - (z * perspective);
      const scale = 1 - (z / 300);
      
      this.svg!.append('ellipse')
        .attr('cx', x)
        .attr('cy', perspectiveY)
        .attr('rx', 15 * scale)
        .attr('ry', 10 * scale)
        .attr('fill', syllable.isLong ? '#e74c3c' : '#3498db')
        .attr('opacity', 0.8 * scale);
    });
  }

  private getStressColor(stress: number): string {
    const intensity = Math.floor(stress * 255);
    return `rgba(255, ${255 - intensity}, 0, 0.7)`;
  }

  private showTooltip(event: MouseEvent, syllable: any): void {
    // Implementation for tooltip display
    console.log('Tooltip:', syllable);
  }

  private hideTooltip(): void {
    // Implementation for tooltip hiding
  }

  private startFlowAnimation(g: d3.Selection<SVGGElement, unknown, null, undefined>, pathData: any[]): void {
    const particles = g.selectAll('.flow-particle')
      .data(Array.from({ length: 5 }, (_, i) => i))
      .enter()
      .append('circle')
      .attr('class', 'flow-particle')
      .attr('r', 3)
      .attr('fill', '#f39c12')
      .attr('opacity', 0.7);

    const animateParticles = () => {
      particles.transition()
        .duration(2000 / (this.animationSpeed / 50))
        .attrTween('cx', (d, i) => {
          return (t: number) => {
            const progress = (t + i * 0.2) % 1;
            const index = Math.floor(progress * (pathData.length - 1));
            return pathData[index].x;
          };
        })
        .attrTween('cy', (d, i) => {
          return (t: number) => {
            const progress = (t + i * 0.2) % 1;
            const index = Math.floor(progress * (pathData.length - 1));
            return pathData[index].y;
          };
        })
        .on('end', () => {
          if (this.isAnimating) {
            animateParticles();
          }
        });
    };

    animateParticles();
  }

  toggleAnimation(): void {
    this.isAnimating = !this.isAnimating;
    if (this.visualizationType === 'flow') {
      this.updateVisualization();
    }
  }

  exportVisualization(): void {
    const svgData = new XMLSerializer().serializeToString(this.svgElement.nativeElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `prosody-${this.visualizationType}-${Date.now()}.svg`;
    downloadLink.click();
    
    URL.revokeObjectURL(svgUrl);
  }
}
