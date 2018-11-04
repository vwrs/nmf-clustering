import './style.scss'
import * as d3 from 'd3'

let width = 1000
let height = 1000
let margin = { top: 50, right: 10, bottom: 10, left: 30 }

d3.json('data.json').then(visualizeNmf)

function visualizeNmf (data) {
  let N = data.matrix.length

  let matrix = []
  data.matrix.forEach(function (vector, i) {
    matrix[i] = d3.range(N).map(function (j) {
      return { x: j, y: i, v: vector[j] }
    })
  })

  // create a SVG object
  let svg = d3.select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('margin-left', -margin.left + 'px')
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // row, column scaling
  let colorScale = d3.scaleSequential(
    function (t) { return d3.interpolate('white', 'steelblue')(t) }
  ).domain([0, d3.max(data.matrix, function (row) { return d3.max(row) })])

  let x = d3.scaleBand().range([0, width]).domain(d3.range(N))
  let y = d3.scaleBand().range([0, height]).domain(d3.range(N))

  // let colorGroup = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10))
  // let matVal = data.matrix[0].map(function (e) { return e[1] })
  // let maxVal = Math.max.apply(null, matVal)
  // let minVal = Math.min.apply(null, matVal)
  // let scaleOpacity = d3.scaleLinear().domain([minVal, maxVal]).clamp(true)
  // let scaleOpacity = d3.scaleLinear().domain([0, 1]).clamp(true)

  svg.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)

  // text labeling
  // -----------------------
  // d3.select('body')
  //   .append('pre')
  //   .style('background', 'black')
  //   .style('color', 'white')
  //   .text(x.bandwidth())
  let posXLabel = { x: 6, y: x.bandwidth() / 2 } // rotated by 90 deg
  let posYLabel = { x: -25, y: y.bandwidth() / 2 }
  let dyText = '.32em'

  let rowText = svg.selectAll('.row')
    .data(matrix)
    .enter().append('g')
    .attr('class', 'row')
    .attr('transform', function (d, i) { return 'translate(0,' + y(i) + ')' })

  rowText.append('line')
    .attr('x2', width)

  rowText.append('text')
    .attr('x', posYLabel['x'])
    .attr('y', posYLabel['y'])
    .attr('dy', dyText)
    .text(function (d, i) { return i })

  let colText = svg.selectAll('.column')
    .data(matrix)
    .enter().append('g')
    .attr('class', 'column')
    .attr('transform', function (d, i) { return 'translate(' + x(i) + ')rotate(-90)' })

  colText.append('line')
    .attr('x1', -height)

  colText.append('text')
    .attr('x', posXLabel['x'])
    .attr('y', posXLabel['y'])
    .attr('dy', dyText)
    .text(function (d, i) { return i })

  // create cells
  let cells = svg.selectAll('.cell')
    .data(matrix)
    .enter().append('g')
    .attr('class', 'cell')
    .attr('transform', function (d, i) {
      return 'translate(' + x(d.x) + ',' + y(d.y) + ')'
    })

  cells.each(fillCells)

  function fillCells (elem) {
    d3.select(this).selectAll('.cell')
      .data(elem.filter(function (d) { return d.v }))
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', function (d) { return x(d.x) })
      .attr('y', function (d) { return y(d.y) })
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      // TODO colorize for each group
      .attr('opacity', 0.7)
      // .style('fill-opacity', function (d) { return scaleOpacity(d.v) })
      // .attr('fill', function (d) { return colorGroup(data.rgroup[d.x]) })
      .attr('fill', function (d) { return colorScale(data.rgroup[d.x]) })
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)
  }

  function mouseover (p) {
    d3.selectAll('.row text').classed('active', function (d, i) { return i === p.y })
    d3.selectAll('.column text').classed('active', function (d, i) { return i === p.x })
  }

  function mouseout () {
    d3.selectAll('text').classed('active', false)
  }

  d3.select('#order').on('change', function () {
    order(this.value)
  })

  function order (value) {
    orderColumn(value)
    setTimeout(orderRow, 4000, value)
  }

  function orderRow (value) {
    if (value === 'group') {
      y.domain(data.row_order)
    } else { // sort by index
      y.domain(d3.range(N))
    }

    let t = svg.transition().duration(2000)

    t.selectAll('.row')
      .delay(function (d, i) { return y(i) * 0.5 })
      .attr('transform', function (d, i) { return 'translate(0,' + y(i) + ')' })

    t.selectAll('.cell')
      .delay(function (d) { return y(d.y) * 0.5 })
      .attr('y', function (d) { return y(d.y) })
  }

  function orderColumn (value) {
    if (value === 'group') {
      x.domain(data.column_order)
    } else { // sort by index
      x.domain(d3.range(N))
    }

    let t = svg.transition().duration(2000)

    t.selectAll('.column')
      .delay(function (d, i) { return x(i) * 0.5 })
      .attr('transform', function (d, i) { return 'translate(' + x(i) + ')rotate(-90)' })

    t.selectAll('.cell')
      .delay(function (d) { return x(d.x) * 0.5 })
      .attr('x', function (d) { return x(d.x) })
  }

  // color scaling
  // let scale = d3.scaleBand()
  //   .rangeRound([0, d3.min([width, height])])
  //   .domain(d3.range(N))
  // draw matrix as heatmap
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

  // function order (value) {
  //   if (value === 'group') {
  //     x.domain(data.row_order)
  //     y.domain(data.column_order)
  //   } else { // sort by index
  //     x.domain(d3.range(N))
  //     y.domain(d3.range(N))
  //   }
  //
  //   let t = svg.transition().duration(2000)
  //
  //   t.selectAll('.row')
  //     .delay(function (d, i) { return x(i) * 1 })
  //     .attr('transform', function (d, i) { return 'translate(0,' + x(i) + ')' })
  //     .selectAll('.cell')
  //     .delay(function (d) { return x(d.x) * 1 })
  //     .attr('x', function (d) { return x(d.x) })
  //
  //   t.selectAll('.column')
  //     .delay(function (d, i) { return y(i) * 1 })
  //     .attr('transform', function (d, i) { return 'translate(' + y(i) + ')rotate(-90)' })
  // }
  //
}
