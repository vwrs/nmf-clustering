import './style.scss'
import * as d3 from 'd3'

let margin = { top: 50, right: 50, bottom: 10, left: 30 }

// FIXME: for debug
// d3.select('body')
//   .append('pre')
//   .style('background', 'black')
//   .style('color', 'white')
//   .text(width)

d3.json('data.json').then(visualizeNmf)

function visualizeNmf (data) {
  let insMatrix = new Drawer('matrix', data, 'steelblue')
  let insW = new Drawer('w', data, 'green')
  let insH = new Drawer('h', data, 'purple')
  insMatrix.draw()
  insW.draw()
  insH.draw()

  d3.select('#order').on('change', function () {
    let val = this.value
    insW.orderRow(val)
    insMatrix.orderRow(val)

    setTimeout(function () {
      insMatrix.orderColumn(val)
      insH.orderColumn(val)
    }, 4000)
  })
}

let Drawer = class Drawer {
  constructor (name, data, color = 'steelblue') {
    this.data = data
    this.name = name
    this.color = color

    let elem = document.getElementById(this.name)
    this.width = window.innerWidth || document.documentElement.clientWidth || elem.clientWidth
    this.height = window.innerHeight || document.documentElement.clientHeight || elem.clientHeight
    this.width -= 2 * (margin.right + margin.left)
    this.height -= 2 * (margin.top + margin.bottom)
    switch (this.name) {
      case 'matrix':
        this.matrix = this.data.matrix
        this.N = this.matrix.length
        this.D = this.matrix[0].length
        this.rowsize = this.N
        this.colsize = this.D
        break

      case 'w':
        this.width = elem.clientWidth - margin.right
        this.matrix = this.data.W
        this.N = this.matrix.length
        this.D = this.matrix[0].length
        this.rowsize = this.N
        this.colsize = this.D
        break

      case 'h':
        this.height = elem.clientHeight - margin.top
        this.matrix = this.data.H
        this.N = this.matrix[0].length
        this.D = this.matrix.length
        this.rowsize = this.D
        this.colsize = this.N
        break
    }
  }

  draw () {
    let matrix = []
    let N = this.N
    let color = this.color

    this.matrix.forEach(function (vector, i) {
      matrix[i] = d3.range(N).map(function (j) {
        return { x: j, y: i, v: vector[j] }
      })
    })

    // create a SVG object
    this.svg = d3.select('#' + this.name)
      .append('svg')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .style('margin-left', -margin.left + 'px')
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // row, column scaling
    let colorScale = d3.scaleSequential(
      function (t) { return d3.interpolate('white', color)(t) }
    ).domain([0, d3.max(this.matrix, function (row) { return d3.max(row) })])

    this.x = d3.scaleBand().range([0, this.width]).domain(d3.range(this.colsize))
    this.y = d3.scaleBand().range([0, this.height]).domain(d3.range(this.rowsize))

    // let colorGroup = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10))
    // let matVal = this.matrix[0].map(function (e) { return e[1] })
    // let maxVal = Math.max.apply(null, matVal)
    // let minVal = Math.min.apply(null, matVal)
    // let scaleOpacity = d3.scaleLinear().domain([minVal, maxVal]).clamp(true)
    // let scaleOpacity = d3.scaleLinear().domain([0, 1]).clamp(true)

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
      .attr('transform', function (d, i) { return 'translate(0,' + y(d) + ')' })

    rowText.append('line')
      .attr('x2', this.width)

    rowText.append('text')
      .attr('x', posYLabel['x'])
      .attr('y', posYLabel['y'])
      .attr('dy', dyText)
      .text(function (d, i) { return i })

    let colText = this.svg.selectAll('.' + colClass)
      .data(d3.range(this.colsize))
      .enter().append('g')
      .attr('class', colClass)
      .attr('transform', function (d, i) { return 'translate(' + x(d) + ')rotate(-90)' })

    colText.append('line')
      .attr('x1', -this.height)

    colText.append('text')
      .attr('x', posXLabel['x'])
      .attr('y', posXLabel['y'])
      .attr('dy', dyText)
      .text(function (d, i) { return i })

    // create cells
    let cells = this.svg.selectAll('.' + cellClass)
      .data(matrix)
      .enter().append('g')
      .attr('class', cellClass)
      // .attr('transform', function (d, i) {
      //   return 'translate(' + x(d.x) + ',' + y(d.y) + ')'
      // })

    let mouseover = this.mouseover
    let mouseout = this.mouseout
    cells.each(function (elem) {
      d3.select(this).selectAll('.' + cellClass)
        .data(elem.filter(function (d) { return d.v }))
        .enter().append('rect')
        .attr('class', cellClass)
        .attr('x', function (d) { return x(d.x) })
        .attr('y', function (d) { return y(d.y) })
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('opacity', opacity)
        // colorize for each group
        // .style('fill-opacity', function (d) { return scaleOpacity(d.v) })
        // .attr('fill', function (d) { return colorGroup(this.data.rgroup[d.x]) })
        .attr('fill', function (d) { return colorScale(d.v) })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
    })

    // draw a matrix as a heatmap
    // g.selectAll('.row')
    //   .data(matrix)
    //   .enter()
    //   .append('g')
    //   .attr('class', 'row')
    //   .attr('transform', function (d, i) { return 'translate(0,' + scale(i) + ')' })
    //   .selectAll('.cell')
    //   .data(function (d) { return d })
    //   .enter()
    //   .append('rect')
    //   .attr('class', 'cell')
    //   .attr('x', function (d, i) { return scale(i) })
    //   .attr('width', scale.bandwidth())
    //   .attr('height', scale.bandwidth())
    //   .attr('opacity', 0.9)
    //   .attr('fill', function (d) { return color(d) })
  }

  mouseover (p) {
    d3.selectAll('.row' + this.name + ' text')
      .classed('active', function (d, i) { return i === p.y })
    d3.selectAll('.col' + this.name + ' text')
      .classed('active', function (d, i) { return i === p.x })
  }

  mouseout () {
    d3.selectAll('text').classed('active', false)
  }

  order (value) {
    this.orderColumn(value)
    setTimeout(this.orderRow, 4000, value)
  }

  orderRow (value) {
    let y = this.y
    if (value === 'sorted') {
      y.domain(this.data.row_order)
    } else { // sort by index
      y.domain(d3.range(this.rowsize))
    }

    let t = this.svg.transition().duration(2000)

    t.selectAll('.row' + this.name)
      .delay(function (d, i) { return y(i) * 0.5 })
      .attr('transform', function (d, i) { return 'translate(0,' + y(i) + ')' })

    t.selectAll('.cell' + this.name)
      .delay(function (d) { return y(d.y) * 0.5 })
      .attr('y', function (d) { return y(d.y) })
  }

  orderColumn (value) {
    let x = this.x
    if (value === 'sorted') {
      x.domain(this.data.column_order)
    } else { // sort by index
      x.domain(d3.range(this.colsize))
    }

    let t = this.svg.transition().duration(2000)

    t.selectAll('.col' + this.name)
      .delay(function (d, i) { return x(i) * 0.5 })
      .attr('transform', function (d, i) { return 'translate(' + x(i) + ')rotate(-90)' })

    t.selectAll('.cell' + this.name)
      .delay(function (d) { return x(d.x) * 0.5 })
      .attr('x', function (d) { return x(d.x) })
  }
}
