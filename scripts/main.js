/*
    Main.js
*/
// Interchangeable Stuff
var WORD_AMOUNT = 600, AVERAGE_LETTER_AMOUNT = 4.5, TIME_LIMIT = 60, AUTO_TYPE_SPEED = 3, AUTO_TYPE_INCREASE = 1;
var words = "confusing hello world something anything too told her father mother be time typing test best mother father daughter son great because mile sentence carry food own does house only made say night it's woman those these play river young night later answer picture father name even mom dad";
// Prefer the bigger built-in list from scripts/words.js when it loaded; the string above is the fallback
if (typeof DEFAULT_WORDS != "undefined" && DEFAULT_WORDS.length)
    words = DEFAULT_WORDS.join(" ");

(function(){
// Internal
var wldiv, inp;

var current = "", last = "";
var cchar = 0, wchar = 0;
var tchar = 0, mistakes = 0;
var cwords = 0, twords = 0;

var started = false, ltime, dtime, time = 0;
var autotype, atimer = 0, usedBot = false;
var duration;
var samples = [], missed = [];

window.onload = function()
{
    if (TIME_LIMIT > Math.pow(60, 3))
        TIME_LIMIT = Math.pow(60, 3);
    wldiv = document.getElementById("words");
    inp = document.getElementById("inp");
    autotype = document.getElementById("autotype").firstChild;
    duration = document.getElementById("duration");
    
    try {
        var savedLimit = parseInt(localStorage.getItem("typingTester.duration"), 10);
        if (savedLimit > 0)
            TIME_LIMIT = savedLimit;
    } catch (e) {}
    duration.value = TIME_LIMIT;
    duration.onchange = function(){
        TIME_LIMIT = parseInt(duration.value, 10) || 60;
        try { localStorage.setItem("typingTester.duration", TIME_LIMIT); } catch (e) {}
        restart();
        inp.focus();
    }
    
    document.getElementById("restartButton").onclick = function(){
        restart();
        inp.focus();
    }
    
    restart();
    inp.focus();
    
    var r = wldiv.getBoundingClientRect();
    if (r.width < inp.getBoundingClientRect().width)
    {
        var con = document.getElementsByClassName("container")[0];
        con.style.margin = "0";
        document.getElementsByClassName("uploadstuff")[0].style.display = "none";
        inp.style.width = r.width + "px";
    }
    
    inp.onkeydown = dokeydown;
    window.onkeydown = function(e)
    {
        if (e.keyCode == 8 && document.activeElement != inp)
            e.preventDefault();
        // Tab or Esc restarts from anywhere
        if (e.keyCode == 9 || e.keyCode == 27)
        {
            e.preventDefault();
            restart();
            inp.focus();
        }
    }
    document.getElementById("wupload").onchange = doupload;
    
    setInterval(check, 1000 / 60);
}

function doupload()
{
    var f = document.getElementById("wupload").files[0];
    var reader = new FileReader();
    reader.onload = function(){
        var r = reader.result;
        while (r.replace(/  /g, " ") != r)
            r = r.replace(/  /g, " ");
        r = r.replace(/\t|\n|\r/g, "");
        words = r;
        restart();
    }
    reader.readAsText(f);
}

function autoType()
{
    if (time >= TIME_LIMIT)
    {
        autotype.click();
        return;
    }
    if (!started)
        started = true;
    usedBot = true;
    
    atimer += AUTO_TYPE_INCREASE;
    if (atimer > AUTO_TYPE_SPEED)
    {
        var am = atimer - AUTO_TYPE_SPEED;
        atimer = 0;
        
        for (var i = 0; i < am; i++)
        {
            var h = document.getElementsByClassName("selected")[0];
            
            if (h.textContent.substring(0, inp.value.length) != inp.value)
                inp.value = "";
            else if (inp.value == h.textContent)
            {
                var ev = document.createEvent("HTMLEvents");
                ev.initEvent("keydown", true, true);
                ev.keyCode = 32;
                inp.dispatchEvent(ev);
            }
            else if (h.textContent.substring(0, inp.value.length) == inp.value)
                inp.value += h.textContent.substring(inp.value.length, inp.value.length + 1);
        }
    }
}

function check()
{
    var h = document.getElementsByClassName("selected")[0];
    if (!h)
        addWord(words.split(" "));
    
    if (started || autotype.checked)
    {
        dtime = new Date().getTime();
        
        if (dtime - ltime >= 1000)
        {
            ltime = dtime;
            time++;
            var t = parseTime(TIME_LIMIT - time);
            samples.push(stats());
            showResult(stats());
            
            document.getElementById("timer").innerHTML = t;
        }
        if (autotype.checked)
            autoType();
        
        if (time >= TIME_LIMIT)
        {
            showOfficialResults(stats());
            showResults(stats());
            restart(true);
        }
        else
            doWordCheck();
    }
    else
    {
        ltime = new Date().getTime();
        dtime = ltime;
    }
}

function parseTime(s)
{
    var ts = s;
    var h = (ts - ts % 3600) / 3600;
    ts -= h * 3600;
    var m = (ts - ts % 60) / 60;
    ts -= m * 60;
    var hs = "", ms = "", ss = "";
    
    if (h != 0)
        hs = makeTwo(h) + ":";
    ms = makeTwo(m) + ":";
    ss = makeTwo(ts);
    return hs + ms + ss;
}
function makeTwo(s)
{
    s = "" + s;
    if (s.length == 1)
        s = "0" + s;
    return s;
}

function dokeydown(e)
{
    if (e.keyCode == 32)
    {
        e.preventDefault();
        submitWord();
        inp.value = "";
    }
    else if (e.keyCode == 9 || e.keyCode == 27)
        return; // handled by window.onkeydown
    else if (!started && !e.ctrlKey)
        started = true;
}

function stats()
{
    var mins = (time || 1) / 60;
    return {
        wpm: Math.floor(cchar / AVERAGE_LETTER_AMOUNT / mins),
        raw: Math.floor(tchar / AVERAGE_LETTER_AMOUNT / mins),
        accuracy: Math.round(((tchar - mistakes) / tchar || 0) * 100 * 10) / 10
    };
}

function paintWord(h, typed)
{
    var ch = h.children;
    for (var i = 0; i < ch.length; i++)
    {
        if (i >= typed.length)
            ch[i].className = "ch" + (i == typed.length ? " next" : "");
        else if (ch[i].textContent == typed.charAt(i))
            ch[i].className = "ch right";
        else
            ch[i].className = "ch wrong";
    }
}

function doWordCheck()
{
    var h = document.getElementsByClassName("selected")[0];
    
    last = current;
    current = inp.value;
    if (last != current && current != "")
    {
        // count every new keystroke past the part that survived from the last frame
        var same = 0;
        while (same < last.length && same < current.length && last.charAt(same) == current.charAt(same))
            same++;
        tchar += current.length - same;
        for (var i = same; i < current.length; i++)
            if (current.charAt(i) != h.textContent.charAt(i))
                mistakes++;
        paintWord(h, current);
        if (h.textContent.substring(0, current.length) == current)
        {
            h.className = "word selected";
            if (wchar < h.textContent.length)
            {
                wchar++;
                cchar++;
            }
        }
        else
            h.className = "word selected incorrect";
    }
    else if (current == "")
    {
        h.className = "word selected";
        paintWord(h, "");
    }
}

function showOfficialResults(st)
{
    document.getElementById("result").innerHTML = "<font style='color:black;'>Speed: <b>" + st.wpm + " WPM</b> <small>(raw " + st.raw + ")</small></font><br /><font style='color:green'>Typed: <b>" + twords + "</b></font><br /><font style='color:red'>Incorrect: <b>" + (twords - cwords) + "</b> words, <b>" + mistakes + "</b> keystrokes</font><br /><font style='color:blue;'>Accuracy: <b>" + st.accuracy + "%</b></font>";
}

function loadHistory()
{
    try {
        return JSON.parse(localStorage.getItem("typingTester.history")) || [];
    } catch (e) { return []; }
}
function saveHistory(hist)
{
    try {
        localStorage.setItem("typingTester.history", JSON.stringify(hist.slice(-50)));
    } catch (e) {}
}
function bestOf(hist, seconds)
{
    var best = null;
    for (var i = 0; i < hist.length; i++)
        if (hist[i].seconds == seconds && !hist[i].bot && (!best || hist[i].wpm > best.wpm))
            best = hist[i];
    return best;
}

function showResults(st)
{
    var hist = loadHistory();
    var prev = bestOf(hist, TIME_LIMIT);
    var run = { date: new Date().getTime(), wpm: st.wpm, raw: st.raw, accuracy: st.accuracy, seconds: TIME_LIMIT, words: twords, bot: usedBot };
    hist.push(run);
    saveHistory(hist);
    
    var best = document.getElementById("best");
    if (usedBot)
        best.innerHTML = "Bot run &mdash; not counted towards your best";
    else if (!prev || st.wpm > prev.wpm)
        best.innerHTML = "<b>New personal best</b> for " + TIME_LIMIT + "s: " + st.wpm + " WPM" + (prev ? " (was " + prev.wpm + ")" : "");
    else
        best.innerHTML = "Personal best for " + TIME_LIMIT + "s: <b>" + prev.wpm + " WPM</b> on " + new Date(prev.date).toLocaleDateString();
    
    drawChart(document.getElementById("chart"), samples);
    
    var m = document.getElementById("missed");
    if (missed.length == 0)
        m.innerHTML = "<b>No missed words.</b>";
    else
    {
        var html = "<b>Missed words (" + missed.length + "):</b> ";
        for (var i = 0; i < missed.length; i++)
            html += (i ? ", " : "") + "<span class='miss'>" + escapeHtml(missed[i].want) + "</span> <small>you typed &ldquo;" + escapeHtml(missed[i].got) + "&rdquo;</small>";
        m.innerHTML = html;
    }
    
    var h = "<table><tr><th>When</th><th>Length</th><th>WPM</th><th>Raw</th><th>Accuracy</th></tr>";
    for (var i = hist.length - 1; i >= 0 && i >= hist.length - 10; i--)
    {
        var d = new Date(hist[i].date);
        h += "<tr" + (i == hist.length - 1 ? " class='now'" : "") + "><td>" + d.toLocaleDateString() + " " + makeTwo(d.getHours()) + ":" + makeTwo(d.getMinutes()) + "</td><td>" + hist[i].seconds + "s" + (hist[i].bot ? " bot" : "") + "</td><td><b>" + hist[i].wpm + "</b></td><td>" + hist[i].raw + "</td><td>" + hist[i].accuracy + "%</td></tr>";
    }
    h += "</table><button id='clearHistory'>Clear history</button>";
    document.getElementById("history").innerHTML = h;
    document.getElementById("clearHistory").onclick = function(){
        saveHistory([]);
        document.getElementById("history").innerHTML = "History cleared.";
        document.getElementById("best").innerHTML = "";
    }
    
    document.getElementById("results").style.display = "block";
}

function escapeHtml(t)
{
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// WPM over the test, one sample per second: net in blue, raw in orange
function drawChart(canvas, data)
{
    var W = 600, H = 180, L = 36, R = 52, T = 14, B = 24;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    ctx.font = "11px Verdana";
    
    var max = 10;
    for (var i = 0; i < data.length; i++)
        max = Math.max(max, data[i].raw, data[i].wpm);
    max = Math.ceil(max / 10) * 10;
    
    var x = function(i){ return L + (data.length < 2 ? 0 : i / (data.length - 1) * (W - L - R)); };
    var y = function(v){ return T + (1 - v / max) * (H - T - B); };
    
    ctx.strokeStyle = "#e4e4e4";
    ctx.fillStyle = "#888";
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    for (var g = 0; g <= max; g += max / 5)
    {
        ctx.beginPath();
        ctx.moveTo(L, y(g) + .5);
        ctx.lineTo(W - R, y(g) + .5);
        ctx.stroke();
        ctx.fillText(Math.round(g), L - 6, y(g) + 4);
    }
    ctx.textAlign = "center";
    for (var s = 0; s < data.length; s += Math.max(1, Math.round(data.length / 6)))
        ctx.fillText((s + 1) + "s", x(s), H - 8);
    ctx.fillText(data.length + "s", x(data.length - 1), H - 8);
    
    var series = [ { key: "raw", color: "#d98c2b", label: "raw" }, { key: "wpm", color: "#3355dd", label: "WPM" } ];
    for (var k = 0; k < series.length; k++)
    {
        var sr = series[k];
        ctx.strokeStyle = sr.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (var i = 0; i < data.length; i++)
            ctx[i ? "lineTo" : "moveTo"](x(i), y(data[i][sr.key]));
        ctx.stroke();
        if (data.length)
        {
            var lastv = data[data.length - 1][sr.key];
            ctx.fillStyle = sr.color;
            ctx.beginPath();
            ctx.arc(x(data.length - 1), y(lastv), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#333";
            ctx.textAlign = "left";
            ctx.fillText(sr.label + " " + lastv, W - R + 8, y(lastv) + 4 + (k == 0 && Math.abs(y(lastv) - y(data[data.length - 1].wpm)) < 12 ? 12 : 0));
        }
    }
    
    var info = document.getElementById("chartinfo");
    info.innerHTML = "WPM every second &mdash; hover the chart to read a point";
    canvas.onmousemove = function(e)
    {
        var r = canvas.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width * W;
        var i = Math.round((px - L) / (W - L - R) * (data.length - 1));
        if (i < 0 || i >= data.length) return;
        info.innerHTML = (i + 1) + "s &mdash; <b>" + data[i].wpm + " WPM</b>, raw " + data[i].raw + ", " + data[i].accuracy + "% accurate";
    }
}

function showResult(st)
{
    document.getElementById("result").innerHTML = "Your Typing Speed is: <b>" + st.wpm + " WPM</b> <small>raw " + st.raw + " &middot; " + st.accuracy + "% accurate</small>";
}

function restart(keepResults)
{
    inp.blur();
    if (!keepResults)
        document.getElementById("results").style.display = "none";
    samples = [];
    missed = [];
    usedBot = false;
    started = false;
    time = 0;
    cchar = 0;
    tchar = 0;
    mistakes = 0;
    wchar = 0;
    last = current = "";
    generateWords();
    wldiv.children[0].className = "word selected";
    paintWord(wldiv.children[0], "");
    wldiv.scrollTop = 0;
    inp.value = "";
    cwords = 0;
    twords = 0;
    document.getElementById("timer").innerHTML = parseTime(TIME_LIMIT);
}

function submitWord()
{
    var h = document.getElementsByClassName("selected")[0];
    
    last = current;
    current = inp.value;
    if (current != "")
    {
        h.className = "word passed";
        wchar = 0;
        tchar++;
        if (h.textContent != current)
        {
            h.className += " incorrect";
            missed.push({ want: h.textContent, got: current });
        }
        else
        {
            h.className += " correct";
            cchar++;
            cwords++;
        }
        twords++;
        
        var ns = h.nextSibling;
        if (!ns)
            ns = addWord(words.split(" "));
        ns.className = "word selected";
        
        if (ns.getBoundingClientRect().top != h.getBoundingClientRect().top)
            doScroll(ns);
    }
}

function addWord(warry)
{
    var rand = Math.floor(Math.random() * warry.length);
    var word = warry[rand];
    var wdiv = document.createElement("div");
    for (var i = 0; i < word.length; i++)
    {
        var c = document.createElement("span");
        c.className = "ch";
        c.textContent = word.charAt(i);
        wdiv.appendChild(c);
    }
    wdiv.className = "word";
    
    wldiv.appendChild(wdiv);
    return wdiv;
}

function generateWords()
{
    var warry = words.split(" ");
    wldiv.innerHTML = "";
    for (var i = 0; i < WORD_AMOUNT; i++)
        addWord(warry);
}

function doScroll(el)
{
    wldiv.scrollTop += el.getBoundingClientRect().top - wldiv.getBoundingClientRect().top - 5;
}}).call(window);
