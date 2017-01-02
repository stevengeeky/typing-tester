/*
    Main.js
*/
// Interchangeable Stuff
var WORD_AMOUNT = 600, AVERAGE_LETTER_AMOUNT = 4.5, TIME_LIMIT = 60, AUTO_TYPE_SPEED = 3, AUTO_TYPE_INCREASE = 1;
var words = "confusing hello world something anything too told her father mother be time typing test best mother father daughter son great because mile sentence carry food own does house only made say night it's woman those these play river young night later answer picture father name even mom dad";

(function(){
// Internal
var wldiv, inp;

var current = "", last = "";
var cchar = 0, wchar = 0;
var cwords = 0, twords = 0;

var started = false, ltime, dtime, time = 0;
var autotype, atimer = 0;

window.onload = function()
{
    if (TIME_LIMIT > Math.pow(60, 3))
        TIME_LIMIT = Math.pow(60, 3);
    wldiv = document.getElementById("words");
    inp = document.getElementById("inp");
    autotype = document.getElementById("autotype").firstChild;
    
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
            showResult(Math.floor(cchar / AVERAGE_LETTER_AMOUNT / time * 60));
            
            document.getElementById("timer").innerHTML = t;
        }
        if (autotype.checked)
            autoType();
        
        if (time >= TIME_LIMIT)
        {
            showOfficialResults(Math.floor(cchar / AVERAGE_LETTER_AMOUNT / time * 60));
            restart();
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
    else if (!started && !e.ctrlKey)
        started = true;
}

function doWordCheck()
{
    var h = document.getElementsByClassName("selected")[0];
    
    last = current;
    current = inp.value;
    if (last != current && current != "")
    {
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
        h.className = "word selected";
}

function showOfficialResults(wpm)
{
    document.getElementById("result").innerHTML = "<font style='color:black;'>Speed: <b>" + wpm + " WPM</b></font><br /><font style='color:green'>Typed: <b>" + twords + "</b></font><br /><font style='color:red'>Incorrect: <b>" + (twords - cwords) + "</b></font><br /><font style='color:blue;'>Accuracy: <b>" + Math.round(((cwords / twords) || 0) * 100 * 1000) / 1000 + "%</b></font>";
}

function showResult(wpm)
{
    document.getElementById("result").innerHTML = "Your Typing Speed is: <b>" + wpm + " WPM</b>";
}

function restart()
{
    inp.blur();
    started = false;
    time = 0;
    cchar = 0;
    generateWords();
    wldiv.children[0].className = "word selected";
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
        if (h.textContent != current)
            h.className += " incorrect";
        else
        {
            h.className += " correct";
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
    wdiv.textContent = word;
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
