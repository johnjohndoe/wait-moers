var days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
var width = 1000;
var height = 500;
var min_r = 2;
var max_r = 30;
var distance = 50;
var timeframe = 15;

var svg = d3.select("#graph").append("svg").attr("width", width).attr("height", height + 25);

function select( d)
{
    if( d3.select( "#control-" + d ).attr( "class" ) == "selected" ) {
        d3.select( "#control-" + d ).attr( "class", "" );
        d3.select( "#group-"   + d ).attr( "class", "data" );
    } else {
        d3.selectAll( "#control > li" ).attr( "class", "" );
        d3.selectAll( "g.selected"    ).attr( "class", "data" )
        d3.select( "#control-" + d    ).attr( "class", "selected" );
        d3.select( "#group-"   + d    ).attr( "class", "selected" );
    }
}

function getDateOfISOWeek( w, y)
{
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

function getWeekStr( w)
{
	if( weeks.length > 0) {
		var diff = weeks[ weeks.length - 1] - w;

		if( 0 == diff) {
			return "diese Woche";
		} else if( 1 == diff) {
			return "letzte Woche";
		} else if( 2 == diff) {
			return "vorletzte Woche";
		}

		return "vor " + diff + " Wochen";
	}

	return w + ". Woche";
}

d3.json("data.php",
    function(d) {
//        console.log(d[0]);

		if(( d.length > 1) && (typeof d[d.length-1].lastwait !== "undefined")) {
			lastwait = d[d.length-1].lastwait;
			lastnumber = d[d.length-1].lastnumber;
			d.pop();
			document.getElementById( "number").innerHTML = lastnumber;
			document.getElementById( "minutes").innerHTML = "ca. " + lastwait + " Minuten Wartezeit";
		} else {
			document.getElementById( "minutes").innerHTML = 'Zurzeit geschlossen';
		}

        waits = _.map(d, function(d) {
            return d.wait;
        });
        wds = _.map(d, function(d) {
            return d.weekday;
        });
        hrs = _.map(d, function(d) {
            return d.hour;
        });

//       console.log(_.uniq(wds));

        rscale = d3.scale.sqrt().domain([_.min(waits), _.max(waits)]).range([min_r, max_r]);
        yscale = d3.scale.linear().domain([_.min(wds), _.max(wds)]).range([distance, height - distance]);
        xscale = d3.scale.linear().domain([_.min(hrs), _.max(hrs)]).range([distance, width - distance]);

        d = _.map(d, function(d) {
            d.r = rscale(d.wait);
            d.x = xscale(d.hour);
            d.y = yscale(d.weekday);
            return d;
        });

        d = _.values(_.reduce(d, function(x, y) {
            if (x[y.week]) {
                x[y.week].push(y);
            } else {
                x[y.week] = [y];
            }
            return x;
        },
        {
    }));

    weeks = _.map(d, function(d) {
        return d[0].week;
    });

    legend = svg.append("g")
      .attr("transform", "translate(" + [width - 275, height - 100] + ")")

    legend.append("rect")
      .attr("class", "legend")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 250)
      .attr("height", 100)

	legend.append("text")
      .attr("x", 10)
      .attr("y", 33)
      .attr("text-anchor", "left")
      .text("Durchschnittliche")

	legend.append("text")
      .attr("x", 10)
      .attr("y", 56)
      .attr("text-anchor", "left")
      .text("Wartezeiten im")

	legend.append("text")
      .attr("x", 10)
      .attr("y", 79)
      .attr("text-anchor", "left")
      .text("Bürgerservice")

    legend.append("rect")
      .attr("class", "legend")
      .attr("x", 110)
      .attr("y", 15)
      .attr("width", 0.5)
      .attr("height", 70)

	legend.append("circle")
      .attr("cx", 110 + max_r)
      .attr("cy", 10 + max_r)
      .attr("r", min_r)

    legend.append("circle")
      .attr("cx", 210)
      .attr("cy", 10 + max_r)
      .attr("r", max_r)

    legend.append("text")
      .attr("x", 110 + max_r)
      .attr("y", 30 + max_r * 2)
      .attr("text-anchor", "middle")
      .text(_.min(waits)+" min")

    legend.append("text")
      .attr("x", 210)
      .attr("y", 30 + max_r * 2)
      .attr("text-anchor", "middle")
      .text(_.max(waits)+" min")

    svg.selectAll("g.data")
      .data(d)
      .enter()
      .append("g")
      .attr("id", function(d) {
          return "group-" + d[0].week
      })
      .attr("class", "data")
      .on("click", function(d) {
          select(d[0].week)
      })

    svg.selectAll("g.data")
      .selectAll("circle")
      .data(function(d) { return d })
      .enter()
      .append("circle")
      .attr("cx", function(d) { return d.x })
      .attr("cy", function(d) { return 35 + d.y })
      .attr("r", function(d) { return d.r })
      .attr("class", function(d) { return d.wait <= timeframe ? "quick" : "slow" })
      .append("title")
      .text(function(d) {
		var dt = getDateOfISOWeek( d.week, d.year);
		dt.setDate( dt.getDate() + d.weekday);
		return ""
		+ d.wait + " Minuten Wartezeit\n"
		+ days[ d.weekday] + " " + getWeekStr( d.week) + "\n"
//		+ "(" + dt.getDate() + "." + (dt.getMonth() + 1) + "." + dt.getFullYear() + ")"
      })

    d3.select("#control")
      .selectAll("li")
      .data(weeks)
      .enter()
      .append("li")
      .attr("id", function(d) { return "control-" + d })
      .text(function(d) { return getWeekStr( d); })
      .on("click", select)


})
