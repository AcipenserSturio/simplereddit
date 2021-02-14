String.prototype.paddingLeft = function (paddingValue) {
   return String(paddingValue + this).slice(-paddingValue.length);
};
String.prototype.paddingRight = function (paddingValue) {
   return String(this + paddingValue).slice(0, paddingValue.length);
};
function joinObj(obj, seperator) {
  var out = [];
  for (k in obj) {
    out.push(k);
  }
  return out.join(seperator);
}
function DateToString(inDate, formatString) {
  // Written by Will Morrison 2018-04-05

  // Validate that we're working with a date

  var dateObject = {
    M: inDate.getMonth() + 1,
    d: inDate.getDate(),
    D: inDate.getDate(),
    h: inDate.getHours(),
    m: inDate.getMinutes(),
    s: inDate.getSeconds(),
    y: inDate.getFullYear(),
    Y: inDate.getFullYear()
  };
  // Build Regex Dynamically based on the list above.
  // Should end up with something like this "/([Yy]+|M+|[Dd]+|h+|m+|s+)/g"
  var dateMatchRegex = joinObj(dateObject, "+|") + "+";
  var regEx = new RegExp(dateMatchRegex, "g");
  formatString = formatString.replace(regEx, function(formatToken) {
    var datePartValue = dateObject[formatToken.slice(-1)];
    var tokenLength = formatToken.length;

    // A conflict exists between specifying 'd' for no zero pad -> expand to '10' and specifying yy for just two year digits '01' instead of '2001'.  One expands, the other contracts.
    // so Constrict Years but Expand All Else
    if (formatToken.indexOf('y') < 0 && formatToken.indexOf('Y') < 0) {
      // Expand single digit format token 'd' to multi digit value '10' when needed
      var tokenLength = Math.max(formatToken.length, datePartValue.toString().length);
    }
    var zeroPad = (datePartValue.toString().length < formatToken.length ? "0".repeat(tokenLength) : "");
    return (zeroPad + datePartValue).slice(-tokenLength);
  });

  return formatString;
}
function try_load(urlParams) {
	var r = urlParams.get("r");
	var sort = urlParams.get("sort");
	if (r == null) {
		r = "r/all"
	}
	page_type = get_page_type(urlParams)
	if (sort && page_type != "user") {
		r += "/" + sort
	} else if (page_type == "user") {
		r += "/submitted"
	}
	params_text = "?" + urlParams.toString();
	var reddit_path = 'https://old.reddit.com/' + r + '.json' + params_text;
	console.log(reddit_path);
	console.log("before json")
	console.log(reddit_path)
	$.getJSON(reddit_path, function(data) {
		console.log("*actually* after json" + reddit_path);
		build_website(urlParams, data["data"], page_type);
		after = data["data"]["after"];
		console.log(after)
	});
}

function build_website(params, data, page_type) {
	var nsfw = params.get("nsfw");
	
	for (var i = 0; i < data["children"].length; i++) {
		over_18 = data["children"][i]["data"]["over_18"]
		if (over_18 && nsfw != "none" || !over_18 && nsfw != "only") {
			if (!document.getElementById(data["children"][i]["data"]["name"])) {
				if (page_type == "user") {
					author_visibility = false;
					subreddit_visibility = true;
				} else if (page_type == "subreddit") {
					author_visibility = true;
					subreddit_visibility = false;
				} else {
					author_visibility = true;
					subreddit_visibility = true;
				}
				add_post(data["children"][i]["data"], subreddit_visibility, author_visibility)
			}
		}
	}
}

function get_page_type(params) {
	r = params.get("r");
	if (r == null) {
		r = "r/all"
	}
	if (r[0] == "u") {
		return "user"
	} else {
		if (r != "r/all") {
			return "subreddit"
		} else {
			return "r/all"
		}
	}
}

function add_post(post, subreddit_visibility, author_visibility) {
	var padding = "                         "
	var date_text = DateToString(new Date(post["created"]*1000), "yyyy-MM-dd hh:mm") + " ";
	var author_text = post["author"].paddingRight(padding) + " ";
	var subreddit_text = post["subreddit"].paddingRight(padding) + " ";
	var title_text = post["title"];
	
	row = document.createElement("TR")
	row.id = post["name"];
	add_cell(row, "date", date_text)
	
	if (subreddit_visibility) {add_cell(row, "subreddit", subreddit_text)}
	if (author_visibility) {add_cell(row, "author", author_text)}
	add_cell(row, "title", title_text)
	document.getElementById("posts").children[0].appendChild(row)

}
function add_cell(row, elementclass, text) {
	params = new URLSearchParams(window.location.search);
	var link;
	if (elementclass == "subreddit") {
		link = 'r/' + text;
	} else if (elementclass == "author") {
		link = 'user/' + text;
	}
	cell = document.createElement("TD")
	cell.classList.add(elementclass)
	if (link) {
		cell.onclick = function() { reload_with_param('r', link.trim()) };
	}
	cell.appendChild(document.createTextNode(text))
	row.appendChild(cell)
}
function paramsToString(params) {
	str = ""
	for (i = 0; i < params.length; i++) {
		str += "&" + params[i][0] + "=" + params[i][1]
	}
	str[0] = "?"
	return str
}
const urlParams = new URLSearchParams(window.location.search);
try_load(urlParams);
var after;

window.onscroll = function(ev) {load_more()};
window.onwheel = function(ev) {load_more()};
function load_more() {
	console.log("bottom")
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2000) {
		params = new URLSearchParams(window.location.search);
		params.set("after", after);
		try_load(params)
	}
}
function reload_with_param(param, set) {
	params = new URLSearchParams(window.location.search);
	params.set(param, set);
	window.location.href = window.location.href.split("?")[0] + "?" + params.toString();
}