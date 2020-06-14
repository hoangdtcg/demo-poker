/*
listed in ranking for bridge
S: ♠ U+2660 (&spades;) black
H: ♥ U+2665 (&hearts;) red
D: ♦ U+2666 (&diams;) red blue
C: ♣ U+2663 (&clubs;) black green
2-10,J,Q,K,A
W for suit or values indicates a joker

card size 50by75px
score hand for each row and column
can be cool to do it bingo pattern style as well
*....     ....*     *...*     .....     ..*..
.*...     ...*.     .....     ..*..     .....
..*..     ..*..     ..*..     .***.     *.*.*
...*.     .*...     .....     ..*..     .....
....*     *....     *...*     .....     ..*..


*/




var readyCode = $(function() {
    //var A=14, K=13, Q=12, J=11;
    var __ = {"A": 14, "K": 13, "Q": 12, "J": 11, 10:10, 9:9, 8:8, 7:7, 6:6, 5:5, 4:4, 3:3, 2:2 };
    var _ = { "&spades;":1, "&clubs;":2, "&hearts;":4, "&diams;":8 };
    var names = [0,0,2,3,4,5,6,7,8,9,10,"J","Q","K","A"];
    var zi = 1;
    var firstGame = true;
    var inprog = false;
    var scoreTypes = ["us","brit"];
    var scoring = 0; // us scoring
    var score = [0,0];
    var hands = {
        //id {string, score [us,brit]}
        9: {str: "Royal Flush", score: [100,30]},
        8: {str: "Straught Flush", score: [75,30]},
        7: {str: "Four of a Kind", score: [50,16]},
        6: {str: "Full House", score: [25,10]},
        5: {str: "Flush", score: [20,5]},
        4: {str: "Straight", score: [15,12]},
        3: {str: "Three of a Kind", score: [10,6]},
        2: {str: "Two Pairs", score: [5,3]},
        1: {str: "One Pair", score: [2,1]}
    };

    //patterns.row0.0.num, patterns.row0.0.filled
    var pos = function (n) {
        this.num = n;
        this.filled = false;
    };
    var patt = function (a){
        this[0]= new pos(a[0]);
        this[1]= new pos(a[1]);
        this[2]= new pos(a[2]);
        this[3]= new pos(a[3]);
        this[4]= new pos(a[4]);
        this.created = false;
        this.newlyCreated= function (){
            return !this.created && this[0].filled && this[1].filled && this[2].filled && this[3].filled && this[4].filled;
        };
    };

    var patterns = {
        row0: new patt([0,1,2,3,4]),
        row1: new patt([5,6,7,8,9]),
        row2: new patt([10,11,12,13,14]),
        row3: new patt([15,16,17,18,19]),
        row4: new patt([20,21,22,23,24]),
        col0: new patt([0,5,10,15,20]),
        col1: new patt([1,6,11,16,21]),
        col2: new patt([2,7,12,17,22]),
        col3: new patt([3,8,13,18,23]),
        col4: new patt([4,9,14,19,24]),
        diagf: new patt([4,8,12,16,20]),
        diagb: new patt([0,6,12,18,24]),
        xbig: new patt([0,4,12,20,24]),
        xsmall: new patt([6,8,12,16,18]),
        cbig: new patt([2,10,12,14,22]),
        csmall: new patt([7,11,12,13,17]),
        kitetl: new patt([0,1,5,6,12]),
        kitetr: new patt([3,4,8,9,12]),
        kitebl: new patt([12,15,16,20,21]),
        kitebr: new patt([12,18,19,23,24]),
        arrd: new patt([1,3,6,8,12]),
        arrr: new patt([8,9,12,18,19]),
        arru: new patt([12,16,18,21,23]),
        arrl: new patt([5,6,12,15,16]),
        face: new patt([5,9,16,17,18])
    };
    var pattord = [
        "row0",
        "row1",
        "row2",
        "row3",
        "row4",
        "col0",
        "col1",
        "col2",
        "col3",
        "col4",
        "xbig",
        "xsmall",
        "cbig",
        "csmall",
        "diagf",
        "kitetl",
        "kitetr",
        "kitebl",
        "kitebr",
        "diagb",
        "arrd",
        "arrr",
        "arru",
        "arrl",
        "face"
    ];
    var colNum=2;
    var suits = ["&clubs;","&diams;","&hearts;","&spades;","W"];
    var values =[2,3,4,5,6,7,8,9,10,"J","Q","K","A","W"];
    var deck = [];
    var stack = [];
    var cpos = []; //board position
    cpos.length = 27;
    var pnum = 0; //number of cards placed
    Array.prototype.shuffle = function (){
        var i = this.length, j, temp;
        if ( i === 0 ) return;
        while ( --i ) {
            j = Math.floor( Math.random() * ( i + 1 ) );
            temp = this[i];
            this[i] = this[j];
            this[j] = temp;
        }
    };


    function getPosDetails(p){
        var r = Math.floor(p/5);
        var c = p % 5;
        var n = [];
        if(r >= 0 && r != 4){
            n.push(p+5);
        }
        if(r <= 4 && r !== 0){
            n.push(p-5);
        }
        if(c >= 0 && c != 4){
            n.push(r+1);
        }
        if(c <= 4 && c !== 0){
            n.push(r-1);
        }
        if(p >= 25 || p <0 ) {
            r=0;
            c=0;
        }
        return {
            row: r,
            col: c,
            near: n,
            cards: []
        };
    }

    function makeCard(val,suit){
        id = (suits.indexOf(suit)+1)+(suits.length*values.indexOf(val)+1)-1;
        return {
            value: val,
            suit:suit,
            id: id
        };
    }

    function cardfromID(id){
        ni = id - 1;
        var r = Math.floor(ni/suits.length);
        var c = ni % suits.length;
        return{
            value: values[r],
            suit: suits[c],
            id: id
        };

    }

    function makeDeck(){
        for(i=0;i<suits.length-1;i++){
            for(j=0;j<values.length-1;j++){
                deck.push(makeCard(values[j],suits[i]));
            }
        }
    }

    function shuffleDeck(){
        for(var i = 0; i<100; i++){
            deck.shuffle();
        }
    }

    function toggleface(){
        //this will be triggered onClick or other event on $(playingCard)
        c = cardfromID(parseInt($(this).attr("id").substr(4)));
        var facing = $(this).attr("data-facing");
        if (facing == "false"){
            $(this).children(".value").html(c.value);
            $(this).children(".suit").html(c.suit);
            $(this).attr("data-facing",("true"));
            //remove cbpatt
            $(this).children(".cbpatt").remove();
        } else {
            $(this).children(".value").html("");
            $(this).children(".suit").html("");
            $(this).attr("data-facing",("false"));
            //add cbpatt
            $(this).children(".gloss").before('<div class="cbpatt"></div>');
        }

    }

    function printCard(card,facing){
        var col= (card.suit=="&hearts;" || card.suit=="&diams;")?"001":"black";
        col = (card.suit=="W")?"100":col;
        var c = $('<div id="card'+card.id+'" class="playingCard" data-fh="'+col+'" data-facing="'+facing+'"></div>').html((facing)?'<div class="value">'+card.value+'</div><div class="suit">'+card.suit+'</div><div class="gloss"></div>':'<div class="value"></div><div class="suit"></div><div class="cbpatt"></div><div class="gloss"></div>');
        return c;

    }

    function restartGame(){
        inprog = true;
        //reset game
        zi = 1;
        score = [0,0];
        pnum = 0;
        //reset dotmatrix

        for(var key in patterns){
            // make sure the patterns are all unset
            var patt = patterns[key];
            patt.created = false;
            for(var p=0;p<5;p++){
                TweenLite.to($( $('#patt-'+key+'-'+patterns[key][p].num)),0.5,{
                    backgroundColor: "#000",
                    borderRadius: 2,
                    top: patterns[key][p].top,
                    left: patterns[key][p].left,
                    height: "4px",
                    width: "4px"
                });
                patterns[key][p].filled = false;
            }
        }

        $(".playingCard").remove();
        //stack and card arrays = []
        stack.length = 0;
        for(var i=0; i<cpos.length;i++){
            cpos[i].cards.length = 0;
        }
        shuffleDeck();
        for(var j=0; j<deck.length;j++){
            stack.push(deck[j]);
        }
        cpos[25].cards = stack;
        //add cards
        for(i=0;i<deck.length;i++){
            $("#playSpace").append(printCard(deck[i],false));
        }
        $(".handmade").attr("data-hid","-1").css("visibility","hidden").children().html("");

        $("#mwin").html('<h2>Score:&nbsp;<span id="score">0<span></h2>');//<div="icons">info hands undo restart </div>
        //console.log($("#mwin").html());
        drawCard();
        $("#startreplay").html("Replay");
    }

    function startReplay(){
        if(!inprog && firstGame){ // if game hasn't started yet
            firstGame = false;
            inprog = true;
            drawCard();
            $("#startreplay").html("Replay");
        } else if(!inprog && !firstGame) {
            restartGame();
            $("#startreplay").html("Replay");
        } else {
            if(confirm("Are you sure you want to end this game?")){
                //restart game
                restartGame();
            }
        }
    }

    function createBoard(){
        var w = 50;
        var h = 75;
        var mar = 10;
        var gut = 10;
        //add info and play spaces
        $("#pokerSol").html("").
        append('<div id="infoSpace"><h1>Poker Solitaire</h1></div>').
        append('<div id="playSpace"></div>');

        var pspace = $("#playSpace");
        //add hand patterns
        var ispace =$("#infoSpace").append('<div id="hpatts"><h2>Hand Patterns</h2><div>').append('<div id="dotmatrix" style="position: relative;"></div>');
        //add pattern layouts
        for(var l = 0;l<25;l++){
            var marx =5;
            var mary = 5;
            var pw = 4;
            var ph = 4;
            var pgut = 6;
            var pggut = 20;
            for(var m=0;m<25;m++){
                var pcy = mary +
                    ((ph+pgut)*(Math.floor(m/5))) +
                    ((44+pggut)*(Math.floor(l/5)));
                var pcx = marx + ((pw+pgut)*(m % 5)) +
                    ((44+pggut)*(l % 5));
                $("#dotmatrix").append($('<div class="pattspot" id="patt-'+pattord[l]+'-'+m+'" style="position: absolute; top: '+pcy+'px; left: '+pcx+'px; height: 4px; width: 4px; -webkit-border-radius: 2px; -moz-border-radius: 2px; border-radius:2px; background-color: #e0e0e0";>'+''+'</div>'));
            }
            //add created boxes
            var mw = 44;
            var mh = 44;
            var my = mary - 2 +
                ((mh+pggut)*(Math.floor(l/5)));
            var mx = marx - 2 + ((mw+pggut)*(l % 5));
            $("#dotmatrix").append('<div class="handmade" data-hid="-1" id="hm'+pattord[l]+'" style="top: '+my+'px; left: '+mx+'px;"><div class="gloss"></div><div class="htext"></div><div class="score"></div></div>');
        }
        for(var key in patterns){
            for(var p=0;p<5;p++){
                var point = $('#patt-'+key+'-'+patterns[key][p].num).css("background-color","#000");
                patterns[key][p].top = point.css("top");
                patterns[key][p].left = point.css("left");
            }
        }
        //add spot layout for cards
        for(i=0;i<25;i++){
            var cy = mar + ((h+gut)*(Math.floor(i/5)));
            var cx = mar + ((w+gut)*(i % 5));
            pspace.append($('<div class="cardspot" id="cardspot'+i+'" style="top: '+cy+'px; left: '+cx+'px;" ></div>'));
        }
        pspace.append('<div id="cardstack"></div>').append('<div id="inplay"></div>').append('<div id="startreplay">Start!</div>');
        $("#startreplay").on("click", startReplay);
        //add cards
        for(var i=0;i<deck.length;i++){
            pspace.append(printCard(deck[i],false));
        }
        //add score and action buttons
        ispace.append('<div id="mwin"><h2>Score:&nbsp;<span id="score">0<span></h2>');//<div="icons">info hands undo restart </div></div>


    }

    function pattScore(cs,ss){ //calculates the equivalence score of 5 cards
        var v, i, o, c, d={}, s = 1<<cs[0]|1<<cs[1]|1<<cs[2]|1<<cs[3]|1<<cs[4];
        for (i=v=o=0; i<5; i++) {o=Math.pow(2,cs[i]*4); v += o*(d[cs[i]] = (v/o&15)+1);}
        v = v%15-((s/(s&-s)==31)||(s==0x403c)?3:1)-(ss[0]==(ss[1]|ss[2]|ss[3]|ss[4]))*((s==0x7c00)?-5:1);
        c = (s==0x403c)?[5,4,3,2,1]:cs.slice().sort(function(a,b){return (d[a]<d[b])?1:(d[a]>d[b])?-1:(b-a);});
        return [7,8,4,5,0,1,2,9,3,6][v]<<20|c[0]<<16|c[1]<<12|c[2]<<8|c[3]<<4|c[4];
    }

    function checkHand(p){
        //

        //return handDetails(pattScore( [ 10, J, Q, K, A], [_["♠"],_["♠"],_["♠"],_["♠"],_["♠"] ]));
        //console.log(p);
        var n = p[0].num;
        //console.log(cpos[p[2].num].cards[0].suit);
        return handDetails(
            pattScore(
                [ __[cpos[p[0].num].cards[0].value],
                    __[cpos[p[1].num].cards[0].value],
                    __[cpos[p[2].num].cards[0].value],
                    __[cpos[p[3].num].cards[0].value],
                    __[cpos[p[4].num].cards[0].value]],
                [_[cpos[p[0].num].cards[0].suit],
                    _[cpos[p[1].num].cards[0].suit],
                    _[cpos[p[2].num].cards[0].suit],
                    _[cpos[p[3].num].cards[0].suit],
                    _[cpos[p[4].num].cards[0].suit] ]));

    }

    function handDetails(x){
        var cat = x>>20, c1 = x>>16&15, c3 = x>>8&15,c4 = x>>4&15;
        return (cat === 0)?{hand: "High Card", points: 0, hid: cat }:{hand: hands[cat].str, points: hands[cat].score[scoring], hid: cat };
    }


    function placeCard(card,fspot,tspot,draw){
        if(inprog){
            pnum = ((tspot==26))?pnum:pnum+1;

            var hs = (tspot==26)?$("#inplay"):$("#cardspot"+tspot);
            var hc = $("#card"+card.id);
            var t = (hs.css("top")).toString();
            var l = (hs.css("left")).toString();
            TweenLite.to(hc, 0.2, {top: t, left: l});
            var c = cpos[fspot].cards[cpos[fspot].cards.length-1];
            cpos[tspot].cards.push(c);
            cpos[fspot].cards.length--;
            if(tspot!=26){
                //light up dot matrix
                for(var key in patterns){
                    //change to colour
                    var patt = patterns[key];
                    for (var pkey in patt){
                        if(patt[pkey].num==tspot){
                            TweenLite.to($('#patt-'+key+'-'+tspot),0.5,{
                                backgroundColor: "#C71585",
                                borderRadius: 0,
                                top: "-=2px",
                                left: "-=2px",
                                height: "+=4px",
                                width: "+=4px"
                            });
                            patt[pkey].filled = true;
                        }
                    }
                    //check if pattern is created
                    if(patt.newlyCreated()){
                        //check hand
                        var r = checkHand(patt);
                        //show points and hand for pattern
                        $("#hm"+key).css("visibility","visible").attr("data-hid",r.hid.toString());
                        $("#hm"+key+">.htext").html(r.hand);
                        $("#hm"+key+">.score").html(r.points.toString());
                        patt.created = true;
                        //calculate score
                        //console.log(r);
                        if (r.hid !== 0){
                            score[0] += hands[r.hid].score[0];
                            score[1] += hands[r.hid].score[1];
                        }
                        //console.log(score[scoring]);
                        $("#score").html(score[scoring].toString());
                    }
                }
            }
            if(pnum == 25){
                //end game
                $("#mwin").html('<h2>Game Over!</h2><div>Final score:&nbsp;Score:&nbsp;<span id score="">'+score[scoring]+'<span>!</div><div="icons">info hands undo replay </div>');
                $("#startreplay").html("Start!");
                inprog = false;
            } else {
                if(draw){
                    drawCard();
                }
            }
        }
    }

    function drawCard(){
        var c = cpos[25].cards[cpos[25].cards.length-1];
        var hc = $("#card"+c.id);
        hc.css("zIndex",++zi);
        placeCard(c,25,26,false);
        hc.each(toggleface);
    }



    function init (){
        //make sure no legacy items exist from a previous game

        makeDeck();
        shuffleDeck();
        for(var i=0; i<cpos.length;i++){
            cpos[i]=getPosDetails(i);
        }
        for(var j=0; j<deck.length;j++){
            stack.push(deck[j]);
        }
        cpos[25].cards = stack;
        createBoard();
        $(".cardspot").on("click", function (){
            if(inprog){
                var emptySpot = !($(this).html());
                if(emptySpot){
                    var inplay = cpos[26].cards.length == 1;
                    if(inplay){
                        var c = cpos[26].cards[0];
                        placeCard(c,26,parseInt($(this).attr("id").substr(8)),true);
                    }
                }
            }
        });
    }

    init();

    //$("#pokerSol").append('<div class="handmade"><div class="htext">4 of a kind</div><div class="score">3333</div></div>');

    //c = makeCard("A","&spades;");
    //console.log(stack);
    //console.log(suits);
    //console.log(values);
    //console.log(cardfromID(c.id));

});

/*******************************
 // /////http://www.codeproject.com/Articles/569271/A-Poker-hand-analyzer-in-JavaScript-using-bit-math
 // /////http://jsfiddle.net/subskybox/rwHzm/

 //modifying from jsfiddle
 var A=14, K=13, Q=12, J=11, _ = { "♠":1, "♣":2, "♥":4, "♦":8 };
 var names = [0,0,2,3,4,5,6,7,8,9,10,"Jack","Queen","King","Ace"];

 function get5cardScore(cs,ss){ //calculates the equivalence score of 5 cards
	var v, i, o, c, d={}, s = 1<<cs[0]|1<<cs[1]|1<<cs[2]|1<<cs[3]|1<<cs[4];
  	for (i=v=o=0; i<5; i++) {o=Math.pow(2,cs[i]*4); v += o*(d[cs[i]] = (v/o&15)+1);}
  	v = v%15-((s/(s&-s)==31)||(s==0x403c)?3:1)-(ss[0]==(ss[1]|ss[2]|ss[3]|ss[4]))*((s==0x7c00)?-5:1);
    c = (s==0x403c)?[5,4,3,2,1]:cs.slice().sort(function(a,b){return (d[a]<d[b])?1:(d[a]>d[b])?-1:(b-a);});
	return [7,8,4,5,0,1,2,9,3,6][v]<<20|c[0]<<16|c[1]<<12|c[2]<<8|c[3]<<4|c[4];
}

 function getTypeDetail(x){
	var cat = x>>20, c1 = x>>16&15, c3 = x>>8&15,c4 = x>>4&15;
	switch(cat){
		case 0: return names[c1] + " high";
        //High Card

		case 1: return "Pair of "+names[c1]+"s";
        //1 Pair

		case 2: return "Two pair, "+names[c1]+"s and "+names[c3]+"s";
        //2 Pair

		case 3: return "Three of a kind, "+names[c1]+"s";
        3 of a Kind

		case 4: return names[c1] +" high straight";
        //Straight

		case 5: return names[c1] +" high flush";
        //Flush

		case 6: return names[c1] + "s full of "+names[c4]+"s, Full House";
        //Full house

		case 7: return "Four of a kind, "+names[c1]+"s";
        //4 of a Kind

		case 8: return names[c1]+" high straight flush";
        //Straight Flush
		case 9: return "Royal flush";
        //Royal Flush
	}
}

 var h01 = get5cardScore( [ 10, J, Q, K, A], [_["♠"],_["♠"],_["♠"],_["♠"],_["♠"] ]

 *******************************/