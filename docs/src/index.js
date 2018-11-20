import './style.scss'
import * as d3 from 'd3'

let margin = { top: 30, right: 10, bottom: 10, left: 30 }

d3.json('data.json').then(visualizeNmf)

function visualizeNmf (data) {
  let insMatrix = new Drawer('matrix', data, 'steelblue')
  let insW = new Drawer('w', data, 'green')
  let insH = new Drawer('h', data, 'purple')
  insMatrix.draw()
  insW.draw()
  insH.draw()

  d3.select('#order').on('change', function () {
    insW.orderRow(this.value)
    insMatrix.orderRow(this.value)

    setTimeout(() => {
      insMatrix.orderColumn(this.value)
      insH.orderColumn(this.value)
    }, 3000)
  })

  d3.select('#fill').on('change', function () {
    insMatrix.fillCells(this.value)
    insW.fillCells(this.value)
    insH.fillCells(this.value)
  })
}

let Drawer = class Drawer {
  constructor (name, data, color = 'steelblue', group = true, duration = 2000) {
    this.data = data
    this.name = name
    this.color = color
    this.duration = duration

    let elem = document.getElementById(this.name)
    this.width = elem.clientWidth - margin.left - margin.right
    this.height = elem.clientHeight - margin.top - margin.bottom

    switch (this.name) {
      case 'matrix':
        this.matrix = this.data.matrix
        break

      case 'w':
        this.matrix = this.data.W
        break

      case 'h':
        this.matrix = this.data.H
        break
    }

    this.N = this.matrix.length
    this.D = this.matrix[0].length
    this.rowsize = this.N
    this.colsize = this.D

    // fill color
    // -------------
    let maxVal = d3.max(this.matrix, (row) => d3.max(row))

    // row, column scaling
    this.colorScale = d3.scaleSequential(
      (t) => d3.interpolate('white', color)(t)
    ).domain([0, maxVal])

    // colorize for each group
    let groups = this.data.groups
    let colorGroups = []
    let scaleFunc01 = d3.scaleSequential(d3.interpolate(0, 1))
      .domain([0, groups])
    let colors = d3.range(groups)
      .map((v) => d3.interpolateRainbow(scaleFunc01(v)))

    colors.forEach((color, i) => {
      colorGroups[i] = d3.scaleSequential(
        (t) => d3.interpolate('rgb(255,255,255)', color)(t)
      ).domain([0, maxVal])
    })

    if (this.name === 'h') {
      this.N = this.matrix[0].length
      this.D = this.matrix.length
      this.rowsize = this.D
      this.colsize = this.N
      this.groupFunc = (d, i) => colorGroups[this.data.cgroup[d.x]](d.v)
    } else {
      this.groupFunc = (d, i) => colorGroups[this.data.rgroup[d.y]](d.v)
    }
  }

  draw () {
    let matrix = []
    let N = this.N

    this.matrix.forEach((vector, i) => {
      matrix[i] = d3.range(N).map((j) => ({ x: j, y: i, v: vector[j] }))
    })

    // create a SVG object
    this.svg = d3.select('#' + this.name)
      .append('svg')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    this.x = d3.scaleBand().range([0, this.width]).domain(d3.range(this.colsize))
    this.y = d3.scaleBand().range([0, this.height]).domain(d3.range(this.rowsize))

    this.svg.append('rect')
      .attr('class', 'background')
      .attr('width', this.width)
      .attr('height', this.height)

    // text labeling
    // -----------------------
    let rowClass = 'row' + this.name
    let colClass = 'col' + this.name
    let cellClass = 'cell' + this.name
    let opacity = 0.7
    let posXLabel = { x: 6, y: this.x.bandwidth() / 2 } // rotated by 90 deg
    let posYLabel = { x: -25, y: this.y.bandwidth() / 2 }
    let dyText = '.32em'
    let x = this.x
    let y = this.y

    let rowText = this.svg.selectAll('.' + rowClass)
      .data(d3.range(this.rowsize))
      .enter().append('g')
      .attr('class', rowClass)
      .attr('transform', (d, i) => 'translate(0,' + y(d) + ')')

    rowText.append('line')
      .attr('x2', this.width)

    rowText.append('text')
      .attr('x', posYLabel['x'])
      .attr('y', posYLabel['y'])
      .attr('dy', dyText)
      .text((d, i) => i)

    let colText = this.svg.selectAll('.' + colClass)
      .data(d3.range(this.colsize))
      .enter().append('g')
      .attr('class', colClass)
      .attr('transform', (d, i) => 'translate(' + x(d) + ')rotate(-90)')

    colText.append('line')
      .attr('x1', -this.height)

    colText.append('text')
      .attr('x', posXLabel['x'])
      .attr('y', posXLabel['y'])
      .attr('dy', dyText)
      .text((d, i) => i)

    // create cells
    this.cells = this.svg.selectAll('.' + cellClass)
      .data(matrix)
      .enter().append('g')
      .attr('class', cellClass)

    let colorScale = this.colorScale
    let groupFunc = this.groupFunc
    let name = this.name
    this.cells.each(function (elem) {
      d3.select(this).selectAll('.' + cellClass)
        .data(elem.filter((d) => d.v))
        .enter().append('rect')
        .attr('class', cellClass)
        .attr('x', (d) => x(d.x))
        .attr('y', (d) => y(d.y))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('opacity', opacity)
        .attr('fill', (d) => colorScale(d.v))
        .on('mouseover', (p) => {
          d3.selectAll('.row' + name + ' text')
            .classed('active', (d, i) => i === p.y)
          d3.selectAll('.col' + name + ' text')
            .classed('active', (d, i) => i === p.x)
        })
        .on('mouseout', () => {
          d3.selectAll('.row' + name + ' text').classed('active', false)
          d3.selectAll('.col' + name + ' text').classed('active', false)
        })
    })
  }

  orderRow (value) {
    let y = this.y
    if (value === 'sorted') {
      y.domain(this.data.row_order)
    } else { // sort by index
      y.domain(d3.range(this.rowsize))
    }

    let t = this.svg.transition().duration(this.duration)

    t.selectAll('.row' + this.name)
      .delay((d, i) => y(i) * 0.5)
      .attr('transform', (d, i) => 'translate(0,' + y(i) + ')')

    t.selectAll('.cell' + this.name)
      .delay((d) => y(d.y) * 0.5)
      .attr('y', (d) => y(d.y))
  }

  orderColumn (value) {
    let x = this.x
    if (value === 'sorted') {
      x.domain(this.data.column_order)
    } else { // sort by index
      x.domain(d3.range(this.colsize))
    }

    let t = this.svg.transition().duration(this.duration)

    t.selectAll('.col' + this.name)
      .delay((d, i) => x(i) * 0.5)
      .attr('transform', (d, i) => 'translate(' + x(i) + ')rotate(-90)')

    t.selectAll('.cell' + this.name)
      .delay((d) => x(d.x) * 0.5)
      .attr('x', (d) => x(d.x))
  }

  fillCells (value) {
    let fillFunc = (d) => this.colorScale(d.v)
    if (value === 'group') {
      fillFunc = this.groupFunc
    }
    this.cells.selectAll('rect').style('fill', fillFunc)
  }
}
