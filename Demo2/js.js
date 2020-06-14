/*
 * VIDEO POKER
 * A slot machine style poker game built using Vue & Vuex
 * How to play:
 * 1. Place a bet and click deal
 * 2. Select which cards to hold and discard
 * 3. Click deal again to redraw
 *
 * By Hai Le
 * https://twitter.com/misfitdeveloper
 *
 * Credits:
 * Glossy button style from dodozhang21 (https://codepen.io/dodozhang21/pen/Ewftz)
 * Card images from Game Asset Studio https://assetstore.unity.com/packages/3d/props/tools/free-playing-cards-pack-154780
 */

const actionTypes = {
    SHUFFLE_DECK: 'SHUFFLE_DECK',
    DEAL_CARD: 'DEAL_CARD',
    INITIALIZE_DECK: 'INITIALIZE_DECK',
    REMOVE_FROM_HAND: 'REMOVE_FROM_HAND',
    RESET_HAND: 'RESET_HAND',
    PLACE_BET: 'PLACE_BET',
    PLAY_HAND: 'PLAY_HAND',
    FINALIZE: 'FINALIZE'
};

const mutationTypes = {
    SET_DECK: 'SET_DECK',
    SET_HAND: 'SET_HAND',
    SET_DEAD_STACK: 'SET_DEAD_STACK',
    SET_BET: 'SET_BET',
    SET_CREDITS: 'SET_CREDITS',
    SET_GAMESTATE: 'SET_GAMESTATE',
    SET_PAYLINE: 'SET_PAYLINE',
    SET_WINNINGS: 'SET_WINNINGS'
};

const gamestates = {
    READY: 'READY',
    DEALING: 'DEALING',
    SWAP: 'SWAP',
    SWAPPING: 'SWAPPING'
};

const payLines = {
    ROYAL_FLUSH: 'ROYAL_FLUSH',
    STRAIGHT_FLUSH: 'STRAIGHT_FLUSH',
    FOUR_OF_A_KIND: 'FOUR_OF_A_KIND',
    FULL_HOUSE: 'FULL_HOUSE',
    FLUSH: 'FLUSH',
    STRAIGHT: 'STRAIGHT',
    THREE_OF_A_KIND: 'THREE_OF_A_KIND',
    TWO_PAIR: 'TWO_PAIR',
    PAIR: 'PAIR'
};

const actions = {
    async [actionTypes.INITIALIZE_DECK]({commit, dispatch}){
        const deck = [];
        Array.from(Array(13).keys()).forEach((number) => {
            Array.from(Array(4).keys()).forEach((suit) => {
                deck.push([number, suit]);
            });
        });

        commit(mutationTypes.SET_DECK, await dispatch(actionTypes.SHUFFLE_DECK, deck));
    },

    [actionTypes.SHUFFLE_DECK]({state, commit}, deck) {
        const shuffleArray = arr => arr
            .map((a) => ({sort: Math.random(), value: a}))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => a.value);

        return shuffleArray(deck);
    },

    async [actionTypes.DEAL_CARD]({state, commit, dispatch}) {
        if (!state.deck.length) {
            commit(mutationTypes.SET_DECK, await dispatch(actionTypes.SHUFFLE_DECK, state.dead));
            commit(mutationTypes.SET_DEAD_STACK, []);
        }
        const hand = [...state.hand, ...state.deck.splice(0, 1)];

        commit(mutationTypes.SET_DECK, state.deck);
        commit(mutationTypes.SET_HAND, hand);
    },

    [actionTypes.REMOVE_FROM_HAND]({state, commit}, args) {
        const dead = [...state.dead, ...args.selectedCards];
        commit(mutationTypes.SET_HAND, args.remainingCards);
        commit(mutationTypes.SET_DEAD_STACK, dead);
    },

    async [actionTypes.RESET_HAND]({state, commit, dispatch}) {
        const dead = [...state.dead, ...state.hand];
        const newDeck = await dispatch(actionTypes.SHUFFLE_DECK, [...state.deck, ...dead]);

        //commit(mutationTypes.SET_DEAD_STACK, dead);
        commit(mutationTypes.SET_DEAD_STACK, []);
        commit(mutationTypes.SET_DECK, newDeck);
        commit(mutationTypes.SET_HAND, []);
    },

    [actionTypes.PLACE_BET]({state, commit}, amount) {
        let total = state.bet + amount;
        if(total > 5) {
            total = 5;
        }
        if(total < 0){
            total = 0;
        }
        commit(mutationTypes.SET_BET, total);
    },

    [actionTypes.PLAY_HAND]({state, commit}){
        const credits = state.credits - state.bet;
        commit(mutationTypes.SET_CREDITS, credits);
        commit(mutationTypes.SET_WINNINGS, 0);
        commit(mutationTypes.SET_PAYLINE, null);
    },

    [actionTypes.FINALIZE]({state, commit}){
        const update = payLine => {
            const winnings = state.payTable.find(p => p.id === payLine).multiplier * state.bet;
            commit(mutationTypes.SET_PAYLINE, payLine);
            commit(mutationTypes.SET_WINNINGS, winnings);
            commit(mutationTypes.SET_CREDITS, state.credits + winnings);
        };

        const suits = state.hand.map(c => c[1]);
        const faces = state.hand.map(c => c[0]);

        // flush
        const hasFlush = suits.every((val, i, arr) => val === arr[0]);

        // straight
        faces.sort((a, b) => a - b);
        let hasStraight = faces.every((val, i, arr) => i === arr.length - 1 || val + 1 === arr[i + 1]);
        if(!hasStraight && !faces[0]){
            let i = 1;
            while(i < 5){
                if(faces[i] !== i + 8){
                    break;
                }
                i++;
            }

            hasStraight = i === 5;
        }

        // straight flush
        const hasStraightFlush = hasFlush && hasStraight;

        // royal flush
        const hasRoyalFlush = hasStraightFlush && faces[4] === 12 && faces[0] === 0;
        if(hasRoyalFlush){
            update(payLines.ROYAL_FLUSH);
            return;
        }

        if(hasStraightFlush){
            update(payLines.STRAIGHT_FLUSH);
            return;
        }

        // 4 of a kind
        const hasFourOfAKind = faces[0] === faces[3] || faces[1] === faces[4];
        if(hasFourOfAKind){
            update(payLines.FOUR_OF_A_KIND);
            return;
        }

        // full house
        const hasFullHouse = (faces[0] === faces[1] && faces[2] === faces[4]) || (faces[0] === faces[2] && faces[3] === faces[4]);
        if(hasFullHouse){
            update(payLines.FULL_HOUSE);
            return;
        }

        if(hasFlush){
            update(payLines.FLUSH);
            return;
        }

        if(hasStraight){
            update(payLines.STRAIGHT);
            return;
        }

        // 3 of a kind
        const hasThreeOfAKind = faces[0] === faces[2] || faces[1] === faces[3] || faces[2] === faces[4];
        if(hasThreeOfAKind){
            update(payLines.THREE_OF_A_KIND);
            return;
        }

        // 2 pair
        const hasTwoPair = (faces[0] === faces[1] && faces[2] === faces[3]) || (faces[0] === faces[1] && faces[3] === faces[4]) || (faces[1] === faces[2] && faces[3] === faces[4]);
        if(hasTwoPair){
            update(payLines.TWO_PAIR);
            return;
        }

        // jacks or better
        const hasPair = (arr => {
            for(let i=0; i<arr.length - 1; i++){
                if(arr[i] === arr[i+1] && (arr[i] > 9 || arr[i] === 0)){
                    return true;
                }
            }
            return false;
        })(faces);
        if(hasPair){
            update(payLines.PAIR);
        }
    }
};

const mutations = {
    [mutationTypes.SET_HAND](state, hand) {
        state.hand = hand;
    },

    [mutationTypes.SET_DECK](state, deck) {
        state.deck = deck;
    },

    [mutationTypes.SET_DEAD_STACK](state, dead) {
        state.dead = dead;
    },

    [mutationTypes.SET_BET](state, amount){
        state.bet = amount;
    },

    [mutationTypes.SET_CREDITS](state, credits){
        state.credits = credits;
    },

    [mutationTypes.SET_GAMESTATE](state, gameState){
        state.gamestate = gameState;
    },

    [mutationTypes.SET_PAYLINE](state, payLine){
        state.payLine = payLine;
    },

    [mutationTypes.SET_WINNINGS](state, winnings){
        state.winnings = winnings;
    }
};

const state = {
    hand: [],
    deck: [],
    dead: [],
    payTable: [
        { id: payLines.PAIR, name: 'Jacks or Better', multiplier: 1 },
        { id: payLines.TWO_PAIR, name: '2 Pair', multiplier: 2 },
        { id: payLines.THREE_OF_A_KIND, name: '3 of a Kind', multiplier: 3 },
        { id: payLines.STRAIGHT, name: 'Straight', multiplier: 4 },
        { id: payLines.FLUSH, name: 'Flush', multiplier: 5 },
        { id: payLines.FULL_HOUSE, name: 'Full House', multiplier: 8 },
        { id: payLines.FOUR_OF_A_KIND, name: '4 of a Kind', multiplier: 25 },
        { id: payLines.STRAIGHT_FLUSH, name: 'Straight Flush', multiplier: 50 },
        { id: payLines.ROYAL_FLUSH, name: 'Royal Flush', multiplier: 250 }
    ],
    bet: 0,
    credits: 100,
    gamestate: gamestates.READY,
    winnings: 0,
    payLine: null
};

Vue.component('bet', {
    computed: {
        ...Vuex.mapState([
            'bet',
            'gamestate'
        ]),
        canEnableBets() {
            return this.gamestate === gamestates.READY;
        }
    },
    methods: {
        ...Vuex.mapActions([actionTypes.PLACE_BET]),
        placeBet(amount){
            this[actionTypes.PLACE_BET](amount);
        }
    },
    template: `
    <div class="bet">
      <div class="hud-title">Bet</div>
      <div>
        <span class="bet__button"><button type="button" @click="placeBet(-1)" :disabled="!canEnableBets" :class="{'bet__button--disabled': !canEnableBets}">-</button></span>
        <div class="bet__amount">{{bet}}</div>
        <span class="bet__button"><button type="button" @click="placeBet(1)" :disabled="!canEnableBets" :class="{'bet__button--disabled': !canEnableBets}">+</button></span>
      </div>
    </div>`
});

Vue.component('card', {
    props: ['card'],
    template: `
    <div class="card">
      <div class="card__back"></div>
      <div :class="\`card__front card-$\{card[0]\}-$\{card[1]\}\`" rel="preload"></div>
    </div>`
});

Vue.component('controls', {
    computed: {
        ...Vuex.mapState([
            'bet',
            'gamestate'
        ]),
        canDraw(){
            return (this.gamestate === gamestates.READY || this.gamestate === gamestates.SWAP) && this.bet > 0;
        }
    },
    template: `
    <div class="controls">
      <bet></bet>
      <button class="deal-button" type="button" @click="$emit('deal')" :disabled="!canDraw" :class="{ 'deal-button-can-draw': canDraw }">Deal</button>
    </div>`
});

Vue.component('credits', {
    props:[
        'title',
        'value'
    ],
    data() {
        return {
            wide: false
        }
    },
    watch: {
        title: {
            immediate: true,
            handler(newVal) {
                if(newVal.length > 7){
                    this.wide = true;
                }
            }
        }
    },
    template: `
    <div :class="['credits', { 'credits--wide': wide }]">
      <div class="hud-title">{{title}}</div>
      <div class="credits__amount">{{value}}</div>
    </div>`
});

Vue.component('deck', {
    computed: {
        ...Vuex.mapState([
            'deck'
        ])
    },
    methods: {
        shouldHide(n){
            return false; //n*4 > Math.ceil(this.deck.length/4)*4;
        }
    },
    template: `
    <div class="deck">
      <template v-for="n in 13">
        <div :class="{ hide: shouldHide(n) }"></div>
      </template>
    </div>`
});

Vue.component('score-table', {
    computed: {
        ...Vuex.mapState([
            'payTable',
            'payLine'
        ])
    },
    template: `
    <div class="score-table">
      <div class="hud-title">Score Table</div>
      <div class="score-table__line">
        <div class="score-table__line__name">Bet</div>
        <div class="score-table__line__pay" v-for="n in 5">{{n}}</div>
      </div>
      <template v-for="line in payTable.slice().reverse()">
        <div class="score-table__line" :class="{'score-table__line--win' : line.id === payLine}">
          <div class="score-table__line__name">{{line.name}}</div>
          <div class="score-table__line__pay" v-for="n in 5">{{line.multiplier*n}}</div>
        </div>
      </template>
      <div></div>
    </div>`
});

const game = Vue.component('game', {
    data() {
        return {
            cards: [],
            loaded: false
        };
    },
    computed: {
        ...Vuex.mapState([
            'hand',
            'deck',
            'dead',
            'gamestate',
            'credits',
            'winnings'
        ])
    },
    created() {
        this[actionTypes.INITIALIZE_DECK]();
    },
    mounted() {
        const cards = new Image();
        cards.onload = () => {
            this.loaded = true;
        }
        cards.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1443237/cards.png';
        const back = new Image();
        back.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1443237/back.png';
    },
    methods: {
        ...Vuex.mapActions([
            actionTypes.INITIALIZE_DECK,
            actionTypes.SHUFFLE_DECK,
            actionTypes.DEAL_CARD,
            actionTypes.REMOVE_FROM_HAND,
            actionTypes.RESET_HAND,
            actionTypes.PLAY_HAND,
            actionTypes.FINALIZE]),
        ...Vuex.mapMutations([mutationTypes.SET_CREDITS, mutationTypes.SET_GAMESTATE]),

        async deal(){
            if(this.gamestate === gamestates.READY) {
                this.selected = [];
                this[mutationTypes.SET_GAMESTATE](gamestates.DEALING);
                this[actionTypes.PLAY_HAND]();
                if(this.hand.length) {
                    const elems = this.cards.map(card => this.$refs[`${card.card[0]}-${card.card[1]}`]);
                    gsap.killTweensOf(elems);
                    gsap.to(elems, { scale: 1, duration: 0.2, onComplete: () => this[actionTypes.RESET_HAND]() });
                } else {
                    this[actionTypes.DEAL_CARD]();
                }
                return;
            }

            if(this.gamestate === gamestates.SWAP){
                this.swap();
            }
        },
        selectCard(i){
            if(this.gamestate === gamestates.SWAP){
                this.cards[i].selected = !this.cards[i].selected;
            }
        },
        swap(){
            this[mutationTypes.SET_GAMESTATE](gamestates.SWAPPING);
            const remainingCards = this.cards.filter(x => x.selected).map(x => x.card);
            const selectedCards = this.cards.filter(x => !x.selected).map(x => x.card);
            if(!selectedCards.length){
                this.finalizeHand();
            }
            this[actionTypes.REMOVE_FROM_HAND]({ selectedCards, remainingCards });
        },
        finalizeHand(){
            this[actionTypes.FINALIZE]();
            this[mutationTypes.SET_GAMESTATE](gamestates.READY);
        },
        addCardToHand(card, index){
            const elem = this.$refs[`${card[0]}-${card[1]}`];
            if(elem) {
                const end = 200 * index + 20 * index;
                const timeline = new TimelineLite({
                    onComplete: () => {
                        if(this.cards.length < 5){
                            this[actionTypes.DEAL_CARD]();
                            return;
                        }
                        if(this.gamestate === gamestates.DEALING){
                            this[mutationTypes.SET_GAMESTATE](gamestates.SWAP);
                            return;
                        }
                        if(this.gamestate === gamestates.SWAPPING){
                            this.finalizeHand();
                        }
                    }
                });
                const startZ = 51;//Math.ceil(this.deck.length/4)*4;
                timeline.set(elem, {x:1180, z:startZ, rotateY: 180, opacity: 1});
                timeline.to(elem, 0.2, {z:startZ + 150}).to(elem, 0.6, {x:end, rotateY: 0, z:0});
            }
        },
        moveCards(){
            const elems = this.cards.map(card => this.$refs[`${card.card[0]}-${card.card[1]}`]);
            let removed =0;
            for(let i=0; i<this.cards.length; i++){
                const timeline = new TimelineLite({
                    onComplete: () => {
                        if(removed === elems.length - 1){
                            if(this.cards.length < 5){
                                this[actionTypes.DEAL_CARD]();
                            }
                        } else {
                            removed++;
                        }
                    }
                });
                const end = 200 * i + 20 * i;
                timeline.to(elems[i], 0.6, {x:end});
            }
        },
        removeCardFromHand(removedCards, newCards){
            const elems = removedCards.map(card => this.$refs[`${card[0]}-${card[1]}`]);
            const timeline = new TimelineLite({
                onComplete: () => {
                    this.cards = newCards.map(card => ({ card, selected: false }));
                    this.$nextTick(() => this.moveCards());
                }
            });
            timeline.to(elems, 0.2, {rotateY: 180}).to(elems, 0.2, {x:1180, delay:0.1});
        },
        removeAll(){
            const elems = this.cards.map(card => this.$refs[`${card.card[0]}-${card.card[1]}`]);
            const timeline = new TimelineLite({
                onComplete: () => {
                    this.cards = [];
                    if(this.gamestate === gamestates.SWAPPING || this.gamestate === gamestates.DEALING){
                        this[actionTypes.DEAL_CARD]();
                    }
                }
            });
            timeline.to(elems, 0.2, {rotateY: 180}).to(elems, 0.2, {x:1180, delay:0.1});
        }
    },
    watch: {
        hand(newVal, oldVal){
            if (!newVal.length) {
                this.removeAll();
                return;
            }

            if(newVal.length > oldVal.length) {
                const card = newVal[newVal.length -1];
                this.cards.push({ card, selected: false});
                this.$nextTick(() => {
                    this.addCardToHand(card, newVal.length - 1);
                });
                return;
            }
            this.removeCardFromHand(oldVal.filter(oldCard => !newVal.includes(oldCard)), newVal);
        }
    },
    template:`
    <div class="game">
      <div class="game__display">
        <score-table></score-table>
        <div class="hud">
          <div><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1443237/logo.png"/> Slot Poker</div>
          <credits title="Winnings" :value="winnings"></credits>
          <credits title="Credits" :value="credits"></credits>
          <controls v-if="loaded" @deal="deal"></controls>
          <div v-else class="loading">Loading <span class="dots">.</span><span class="dots">.</span></div>
        </div>
      </div>
      <div class="game__main">
        <div class="hand" ref="hand">
          <div v-for="(card, i) in cards" @click="selectCard(i)" 
              :class="['hand__card', { selected: card.selected }]" 
              :key="\`$\{card.card[0]\}-$\{card.card[1]\}\`" :ref="\`$\{card.card[0]\}-$\{card.card[1]\}\`">
            <card :card="card.card" />
          </div>
        </div>
        <deck></deck>
      </div>
    </div>`
});

new Vue({
    el: '#game',
    store: new Vuex.Store({state,actions,mutations}),
    render(h){
        return h(game);
    }
});
