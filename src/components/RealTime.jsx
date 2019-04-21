import Stomp from 'stompjs'; 
import SockJS from 'sockjs-client'; 
import React, {Component} from 'react'; 
import Binance from '../images/binance-logo.png'; 
import Bittrex from '../images/bittrex-logo.png'; 
import CoinbasePro from '../images/coinbasepro-logo.png'; 
import Huobi from '../images/huobi-logo.png'; 
import E55 from '../images/e55-logo.png'; 
import Bitmex from '../images/bitmex-logo.png'; 
import Bitfinex from '../images/bitfinex-logo.png'; 
import ChartElement from './ChartElement'; 

const venues = [ 
    'BTCUSDT', 
    'BTCUSD', 
    'ETHUSDT', 
    'ETHBTC', 
    'LTCBTC'
]

export default class RealTime extends Component {
    state = {
        price: null,
        stompClient: Stomp.over(new SockJS('http://3.93.103.201:8085/xchange')),
        venues: [],
        prices: [],
        low: null, 
        q1: null, 
        q3: null, 
        high: null 
    }

    // Connect to stomp client, subscribe to orderbook messages, set update interval, suppress debug messages 
    componentDidMount = async () => {
        this.state.stompClient.connect({}, (frame) => {
            console.log(frame.command)
            for (let venue of venues) this.state.stompClient.subscribe('/topic/orderbook/' + venue, (output) => this.process(output, venue));
        })
        this.timer = setInterval(() => this.tick(), 1000); 
        this.state.stompClient.debug = () => {}; 
    }
    componentWillUnmount() {
        clearInterval(this.timer);
        this.state.stompClient.disconnect(); 
    }

    // Send data every minute to the chart component for updating
    tick = () => {
        if ((new Date()).getSeconds() === 0) {
            this.props.addMinute(this.state.prices);
            this.setState({prices: [], low: null, q1: null, q3: null, high: null})
        }
        let prices = this.state.prices.sort(); 
        this.setState({
            low: prices[0],
            q1: prices[Math.round(prices.length/4)],
            q3: prices[prices.length - 1 - Math.round(prices.length/4)],
            high: prices[prices.length - 1]
        })
    }

    // Runs for every message received by stomp client 
    process = async (output, sym) => {
        output = await JSON.parse(output.body); 
        if (sym !== this.props.curr.base + this.props.curr.comp) return; 
        let venues = {}; 
        for (let price in output.askPrice) {
            let venue = ""; 
            for (let v in output.askPrice[price]) venue = v; 
            if (venues[venue] && !venues[venue].ask) venues[venue].ask = price; 
            else if (!venues[venue]) venues[venue] = {bid: null, ask: price}; 
        }
        for (let price in output.bidPrice) {
            let venue = ""; 
            for (let v in output.bidPrice[price]) venue = v; 
            if (venues[venue] && !venues[venue].bid) venues[venue].bid = price; 
            else if (!venues[venue]) venues[venue] = {bid: price, ask: null}; 
        }
        let total = 0, count = 0, totalBid = 0, totalAsk, bidCount = 0, askCount = 0, venueTotals = []; 
        for (let venue in venues) {
            let name = venue; 
            venue = venues[venue]; 
            if (venue.bid) {
                totalBid += parseFloat(venue.bid);
                total += parseFloat(venue.bid); 
                count ++; 
                bidCount ++; 
            }
            if (venue.ask) {
                totalAsk += parseFloat(venue.ask); 
                total += parseFloat(venue.ask); 
                count ++; 
                askCount ++; 
            }
            venueTotals.push({venue: name, ask: totalAsk/askCount, bid: totalBid/bidCount});
            bidCount = 0; 
            totalBid = 0; 
            askCount = 0;
            totalAsk = 0; 
        }
        let price = total/count; 
        if (price > this.props.max) await this.props.setRange(price, this.props.min); 
        if (price < this.props.min) await this.props.setRange(this.props.max, price);
        if (!this.state.price) this.props.setMinutes(price); 
        let prices = this.state.prices; 
        prices.push(price); 
        venueTotals.sort((a, b) => a.venue !== b.venue ? a.venue < b.venue ? -1 : 1 : 0);
        await this.setState({price: total/count, venues: venueTotals, prices})
    }
    render() {
        let {max, diff} = this.props; 
        const images = {
            'BINANCE': Binance,
            'BITREX': Bittrex,
            'COINBASEPRO': CoinbasePro,
            'HUOBI': Huobi, 
            'E55': E55,
            'BITMEX': Bitmex, 
            'BITFINEX': Bitfinex
        }
        let {high, low, q1, q3} = this.state; 
        return (
            <div style = {{display: 'flex', justifyContent: 'space-between'}}> 
                <div> 
                    <div style = {{
                        background: '#314463', 
                        position: 'absolute', 
                        width: 10, 
                        height: 3,
                        left: -1,
                        top: `${((max - this.state.price)/diff)*100}%`
                    }} className = "mr-3"
                    />
                    <ChartElement max = {max} diff = {diff} point = {{high, low, q1, q3}}/>
                </div> 
                <div className = "ml-2 text-center pr-3" style = {{position: 'relative', left: 20}}> 
                    {this.state.venues.map((venue, key) => (
                        <div key = {key}> 
                            <div className = "row m-0 p-0"> 
                                <img alt = "venue logo" src = {images[venue.venue]} height = "25" width = "25"/>
                                <p className = "ml-2" style = {{fontSize: 14}}> {venue.venue} </p>
                            </div>
                            <p style = {{fontSize: 14}}> {venue.bid ? venue.bid.toPrecision(5) : '-'} / {venue.ask ? venue.ask.toPrecision(5) : '-'} </p>
                            <hr className = "my-2"/>
                            <div className = "mb-3"/> 
                        </div> 
                    ))}
                </div>
            </div> 
        )
    }
}