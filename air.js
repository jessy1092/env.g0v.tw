(function(){
  var metrics;
  metrics = {
    NO2: {},
    'PM2.5': {
      domain: [0, 20, 35, 70, 100],
      name: '細懸浮',
      unit: 'μg/m³'
    },
    PM10: {
      domain: [0, 50, 150, 350, 420],
      unit: 'μg/m³',
      name: '懸浮微粒'
    },
    PSI: {
      domain: [0, 50, 100, 200, 300],
      name: '污染指數'
    },
    SO2: {
      name: '二氧化硫'
    },
    CO: {},
    O3: {
      domain: [0, 40, 80, 120, 300],
      name: '臭氧',
      unit: 'ppb'
    }
  };
  $(function(){
    var windowWidth, width, marginTop, height, wrapper, canvas, svg, g, minLatitude, maxLatitude, minLongitude, maxLongitude, dy, dx, proj, path, drawTaiwan, ConvertDMSToDD, drawStations, currentMetric, currentUnit, colorOf, stations, setMetric, drawSegment, addList, epaData, samples, distanceSquare, idwInterpolate, yPixel, plotInterpolatedData, updateSevenSegment, drawHeatmap, drawAll, zoom;
    windowWidth = $(window).width();
    if (windowWidth > 998) {
      width = $(window).height() / 4 * 3;
      width <= 687 || (width = 687);
      marginTop = '0px';
    } else {
      width = $(window).width();
      marginTop = '65px';
    }
    height = width * 4 / 3;
    wrapper = d3.select('body').append('div').style('width', width + 'px').style('height', height + 'px').style('position', 'absolute').style('margin-top', marginTop).style('top', '0px').style('left', '0px').style('overflow', 'hidden');
    canvas = wrapper.append('canvas').attr('width', width).attr('height', height).style('position', 'absolute');
    canvas.origin = [0, 0];
    canvas.scale = 1;
    svg = d3.select('body').append('svg').attr('width', width).attr('height', height).style('position', 'absolute').style('top', '0px').style('left', '0px').style('margin-top', marginTop);
    g = svg.append('g').attr('id', 'taiwan').attr('class', 'counties');
    d3.select('#history').style('top', '-300px').style('left', '-100px').append('svg').attr('width', 300).attr('height', 100);
    $(document).ready(function(){
      var panelWidth;
      panelWidth = $('#main-panel').width();
      if (windowWidth - panelWidth > 1200) {
        $('#main-panel').css('margin-right', panelWidth);
      }
      $('.data.button').on('click', function(it){
        it.preventDefault();
        $('#main-panel').toggle();
        return $('#info-panel').hide();
      });
      $('.forcest.button').on('click', function(it){
        it.preventDefault();
        $('#info-panel').toggle();
        return $('#main-panel').hide();
      });
      return $('.launch.button').on('click', function(it){
        var sidebar;
        it.preventDefault();
        $('#info-panel').hide();
        sidebar = $('.sidebar');
        return sidebar.sidebar('toggle');
      });
    });
    minLatitude = 21.5;
    maxLatitude = 25.5;
    minLongitude = 119.5;
    maxLongitude = 122.5;
    dy = (maxLatitude - minLatitude) / height;
    dx = (maxLongitude - minLongitude) / width;
    proj = function(arg$){
      var x, y;
      x = arg$[0], y = arg$[1];
      return [(x - minLongitude) / dx, height - (y - minLatitude) / dy];
    };
    path = d3.geo.path().projection(proj);
    drawTaiwan = function(countiestopo){
      var counties;
      counties = topojson.feature(countiestopo, countiestopo.objects['twCounty2010.geo']);
      return g.selectAll('path').data(counties.features).enter().append('path').attr('class', function(){
        return 'q-9-9';
      }).attr('d', path);
    };
    ConvertDMSToDD = function(days, minutes, seconds){
      var dd;
      days = +days;
      minutes = +minutes;
      seconds = +seconds;
      dd = minutes / 60 + seconds / (60 * 60);
      return days > 0
        ? days + dd
        : days - dd;
    };
    drawStations = function(stations){
      return g.selectAll('circle').data(stations).enter().append('circle').style('stroke', 'white').style('fill', 'none').attr('r', 2).attr("transform", function(it){
        return "translate(" + proj([+it.lng, +it.lat]) + ")";
      });
    };
    setMetric = function(name){
      var ref$, y, xOff, yOff, x$, y$;
      currentMetric = name;
      colorOf = d3.scale.linear().domain((ref$ = metrics[name].domain) != null
        ? ref$
        : [0, 50, 100, 200, 300]).range([d3.hsl(100, 1.0, 0.6), d3.hsl(60, 1.0, 0.6), d3.hsl(30, 1.0, 0.6), d3.hsl(0, 1.0, 0.6), d3.hsl(0, 1.0, 0.1)]);
      currentUnit = (ref$ = metrics[name].unit) != null ? ref$ : '';
      addList(stations);
      y = 0;
      xOff = width - 100 - 40;
      yOff = height - 32 * 5 - 40;
      svg.append('rect').attr('width', 100).attr('height', 32 * 5).attr('x', 20 + xOff).attr('y', 20 + yOff).style('fill', '#000000').style('stroke', '#555555').style('stroke-width', '2');
      x$ = svg.selectAll("svg").data(colorOf.domain());
      x$.enter().append('rect').attr('width', 20).attr('height', 20).attr('x', 30 + xOff).attr('y', function(){
        return (arguments[1] + 1) * 30 + yOff;
      }).style('fill', function(d){
        return colorOf(d);
      });
      x$.enter().append('text').attr('x', 55 + xOff).attr('y', function(){
        return (arguments[1] + 1) * 30 + 15 + yOff;
      }).attr('d', '.35em').text(function(){
        return arguments[0] + currentUnit;
      }).style('fill', '#AAAAAA').style('font-size', '10px');
      y$ = svg.selectAll("image").data([0]);
      y$.enter().append('svg:image').attr('xlink:href', '/img/g0v-only.svg').attr('x', 20 + xOff).attr('y', -10 + yOff).attr('width', 60).attr('height', 30);
      y$.enter().append('text').attr('x', 80 + xOff).attr('y', 195 + yOff).text('g0v.tw').style('fill', '#000000').style('font-size', '10px');
      return drawHeatmap(stations);
    };
    drawSegment = function(d, i){
      var rawValue, ref$;
      d3.select('#station-name').text(d.name);
      if (epaData[d.name] != null && !isNaN(epaData[d.name][currentMetric])) {
        rawValue = parseInt(epaData[d.name][currentMetric]) + "";
        return updateSevenSegment(repeatString$(" ", 0 > (ref$ = 4 - rawValue.length) ? 0 : ref$) + rawValue);
      } else {
        return updateSevenSegment("----");
      }
    };
    addList = function(stations){
      var list;
      list = d3.select('div.sidebar');
      return list.selectAll('a').data(stations).enter().append('a').attr('class', 'item').text(function(it){
        return it.SITE;
      }).on('click', function(d, i){
        drawSegment(d, i);
        $('.launch.button').click();
        return $('#main-panel').css('display', 'block');
      });
    };
    epaData = {};
    samples = {};
    distanceSquare = function(arg$, arg1$){
      var x1, y1, x2, y2;
      x1 = arg$[0], y1 = arg$[1];
      x2 = arg1$[0], y2 = arg1$[1];
      return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    };
    idwInterpolate = function(samples, power, point){
      var sum, sumWeight, i$, len$, s, d, weight;
      sum = 0.0;
      sumWeight = 0.0;
      for (i$ = 0, len$ = samples.length; i$ < len$; ++i$) {
        s = samples[i$];
        d = distanceSquare(s, point);
        if (d === 0.0) {
          return s[2];
        }
        weight = 1.0 / (d * d);
        sum = sum + weight;
        sumWeight = sumWeight + weight * (isNaN(s[2])
          ? 0
          : s[2]);
      }
      return sumWeight / sum;
    };
    yPixel = 0;
    plotInterpolatedData = function(ending){
      var steps, starts, res$, i$, to$, ridx$, renderLine;
      yPixel = height;
      steps = 2;
      res$ = [];
      for (i$ = 2, to$ = 2 * (steps - 1); i$ <= to$; i$ += 2) {
        ridx$ = i$;
        res$.push(ridx$);
      }
      starts = res$;
      renderLine = function(){
        var c, i$, to$, xPixel, y, x, z, ref$;
        c = canvas.node().getContext('2d');
        for (i$ = 0, to$ = width; i$ <= to$; i$ += 2) {
          xPixel = i$;
          y = minLatitude + dy * ((yPixel + zoom.translate()[1] - height) / zoom.scale() + height);
          x = minLongitude + dx * ((xPixel - zoom.translate()[0]) / zoom.scale());
          z = 0 > (ref$ = idwInterpolate(samples, 4.0, [x, y])) ? 0 : ref$;
          c.fillStyle = colorOf(z);
          c.fillRect(xPixel, height - yPixel, 2, 2);
        }
        if (yPixel >= 0) {
          yPixel = yPixel - 2 * steps;
          return setTimeout(renderLine, 0);
        } else if (starts.length > 0) {
          yPixel = height - starts.shift();
          return setTimeout(renderLine, 0);
        } else if (ending) {
          return setTimeout(ending, 0);
        }
      };
      return renderLine();
    };
    updateSevenSegment = function(valueString){
      var pins, sevenSegmentCharMap;
      pins = "abcdefg";
      sevenSegmentCharMap = {
        ' ': 0x00,
        '-': 0x40,
        '0': 0x3F,
        '1': 0x06,
        '2': 0x5B,
        '3': 0x4F,
        '4': 0x66,
        '5': 0x6D,
        '6': 0x7D,
        '7': 0x07,
        '8': 0x7F,
        '9': 0x6F
      };
      return d3.selectAll('.seven-segment').data(valueString).each(function(d, i){
        var bite, i$, to$, bit, results$ = [];
        bite = sevenSegmentCharMap[d];
        for (i$ = 0, to$ = pins.length - 1; i$ <= to$; ++i$) {
          i = i$;
          bit = Math.pow(2, i);
          results$.push(d3.select(this).select("." + pins[i]).classed('on', (bit & bite) === bit));
        }
        return results$;
      });
    };
    function piped(url){
      return "http://datapipes.okfnlabs.org/csv/?url=" + escape(url);
    }
    drawHeatmap = function(stations){
      var res$, i$, len$, st, val;
      d3.select('#rainfall-timestamp').text(epaData.士林.PublishTime + "");
      d3.select('#station-name').text("已更新");
      updateSevenSegment("    ");
      res$ = [];
      for (i$ = 0, len$ = stations.length; i$ < len$; ++i$) {
        st = stations[i$];
        if (epaData[st.name] != null) {
          val = parseFloat(epaData[st.name][currentMetric]);
          if (isNaN(val)) {
            continue;
          }
          res$.push([+st.lng, +st.lat, val]);
        }
      }
      samples = res$;
      svg.selectAll('circle').data(stations).style('fill', function(st){
        if (epaData[st.name] != null && !isNaN(epaData[st.name][currentMetric])) {
          return colorOf(parseFloat(epaData[st.name][currentMetric]));
        } else {
          return '#FFFFFF';
        }
      }).on('mouseover', function(d, i){
        var ref$, x, y, sitecode;
        drawSegment(d, i);
        ref$ = d3.event, x = ref$.x, y = ref$.y;
        d3.select('#history').style('left', x + 'px').style('top', y + 'px');
        sitecode = d.SITE_CODE;
        return d3.csv(piped("http://graphite.gugod.org/render/?_salt=1392034055.328&lineMode=connected&from=-24hours&target=epa.aqx.site_code." + sitecode + ".pm25&format=csv"), function(data){
          return console.log(data);
        });
      });
      return plotInterpolatedData();
    };
    drawAll = function(_stations){
      var res$, i$, len$, s;
      res$ = [];
      for (i$ = 0, len$ = _stations.length; i$ < len$; ++i$) {
        s = _stations[i$];
        s.lng = ConvertDMSToDD.apply(null, s.SITE_EAST_LONG.split(','));
        s.lat = ConvertDMSToDD.apply(null, s.SITE_NORTH_LAT.split(','));
        s.name = s.SITE;
        res$.push(s);
      }
      stations = res$;
      drawStations(stations);
      return d3.csv(piped('http://opendata.epa.gov.tw/ws/Data/AQX/?$orderby=SiteName&$skip=0&$top=1000&format=csv'), function(it){
        var res$, i$, len$, e;
        res$ = {};
        for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
          e = it[i$];
          res$[e.SiteName] = e;
        }
        epaData = res$;
        setMetric('PM2.5');
        $('.psi').click(function(){
          return setMetric('PSI');
        });
        $('.pm10').click(function(){
          return setMetric('PM10');
        });
        $('.pm25').click(function(){
          return setMetric('PM2.5');
        });
        return $('.o3').click(function(){
          return setMetric('O3');
        });
      });
    };
    zoom = d3.behavior.zoom().on('zoom', function(){
      g.attr('transform', 'translate(' + d3.event.translate.join(',') + ')scale(' + d3.event.scale + ')');
      g.selectAll('path').attr('d', path.projection(proj));
      return canvas.style('transform-origin', 'top left').style('transform', 'translate(' + (zoom.translate()[0] - canvas.origin[0]) + 'px,' + (zoom.translate()[1] - canvas.origin[1]) + 'px)' + 'scale(' + zoom.scale() / canvas.scale + ')');
    }).on('zoomend', function(){
      var this$ = this;
      canvas = wrapper.insert('canvas', 'canvas').attr('width', width).attr('height', height).style('position', 'absolute');
      canvas.origin = zoom.translate();
      canvas.scale = zoom.scale();
      return plotInterpolatedData(function(){
        return wrapper.selectAll('canvas').data([0]).exit().remove();
      });
    });
    if (localStorage.countiestopo && localStorage.stations) {
      setTimeout(function(){
        var stations;
        drawTaiwan(JSON.parse(localStorage.countiestopo));
        stations = JSON.parse(localStorage.stations);
        drawAll(stations);
        return svg.call(zoom);
      }, 1);
    } else {
      d3.json("/twCounty2010.topo.json", function(countiestopo){
        localStorage.countiestopo = JSON.stringify(countiestopo);
        drawTaiwan(countiestopo);
        return d3.csv("/epa-site.csv", function(stations){
          localStorage.stations = JSON.stringify(stations);
          return drawAll(stations);
        });
      });
    }
    return d3.csv(piped('http://opendata.epa.gov.tw/ws/Data/AQF/?$orderby=AreaName&$skip=0&$top=1000&format=csv'), function(forecast){
      var first;
      first = forecast[0];
      d3.select('#forecast').text(first.Content);
      return d3.select('#info-panel').text(first.Content);
    });
  });
  function repeatString$(str, n){
    for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
    return r;
  }
}).call(this);
