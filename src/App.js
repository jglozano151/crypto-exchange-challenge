import React, { Component } from 'react';
import './App.css';
import ChartElement from './components/ChartElement'; 
import RealTime from './components/RealTime'; 

class App extends Component {
  state = {
    currency: {base: 'BTC', comp: 'USDT'},
    weekly: [], 
    daily: [], 
    realTime: [], 
    view: 'weekly',
    prices: [],
    max: 0, 
    min: 0,
    diff: 0,
    temp: null 
  }

  // Sets stochastic data for the past 24 hours based on the latest price on page refresh
  setMinutes = async (price) => {
    let minutes = []; 
    let time = new Date(); 
    let base = price; 
    for (let i = 0; i < 60; i++) {
      base = base*(Math.random() - 0.5)/5000 + base; 
      let lower = base - (Math.random()/5000)*base, 
        higher = base + (Math.random()/5000)*base;
      time = new Date(time - 1000*60); 
      minutes.push({
        time, 
        low: lower, 
        q1: base - Math.random()*(base - lower), 
        q3: base + Math.random()*(higher - base), 
        high: higher 
      })
    }
    let realTime = minutes.reverse(); 
    await this.setState({realTime});
  }

  // Adds the past minute's data to the realTime chart and shifts it over by one minute 
  addMinute = (min) => {
    let realTime = this.state.realTime; 
    realTime.shift(); 
    min = min.sort(); 
    realTime.push({
      time: new Date(Date.now() - 60000), 
      low: min[0], 
      q1: min[Math.round(min.length/4)],
      q3: min[min.length - 1 - Math.round(min.length/4)],
      high: min[min.length - 1]
    })
    this.setState({realTime})
  }
  setTime = async (time) => {
    let data = this.state[time],
      max = 0, 
      min = Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i].low < min) min = data[i].low; 
      if (data[i].high > max) max = data[i].high; 
    }
    let diff = max - min,
      prices = []; 
    for (let i = 0; i < 8; i++) {
      prices.push(min + i*(diff/7))
    }
    await this.setState({prices, view: time, max, min, diff: max - min, loaded: true});
  }
  setCurrency = async (curr) => {
    let temp;
    if (this.state.view !== 'weekly') temp = this.state.view; 
    await (this.setState({loaded: false}))
    let data = await fetch(`https://daollar-challenge-backend.herokuapp.com/crypto?exchange=${curr}`);
    data = await data.json(); 
    data = data[0].data; 
    let weekly = [],
      daily = [], 
      week = [], 
      start; 
    for (let i = 1; i <= data.length; i++) {
      if (i > data.length - 16) {
        let point = data[data.length - i]; 
        let {low, q1, q3, high} = point; 
        daily.push({time: point.date, low, q1, q3, high});
      }
      if (i % 7 === 0) {
        let low = Infinity, high = 0, q1Tot = 0, q3Tot = 0; 
        for (let j = 0; j < week.length; j++) {
          if (week[j].low < low) low = week[j].low; 
          if (week[j].high > high) high = week[j].high; 
          q1Tot += week[j].q1; 
          q3Tot += week[j].q3; 
        }
        weekly.push({time: start, low, q1: q1Tot/week.length, q3: q3Tot/week.length, high})
        week = []; 
        start = ""; 
      }
      else {
        if ((i - 1) % 7 === 0) start = data[data.length - i].date
        week.push(data[data.length - i]); 
      } 
    }
    curr = curr.split('/');
    let base = curr[0], comp = curr[1]; 
    await this.setState({
      currency: {base, comp}, 
      weekly, daily, hourly: [], realTime: []
    })
    if (temp) {
      console.log('Setting to weekly'); 
      await this.setTime('weekly'); 
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      console.log('Setting to realtime')
      await this.setTime(temp); 
    }
    else {
      await this.setTime(this.state.view);
    }
  }
  setRange = async (max, min) => {
    let diff = max - min,
      prices = []; 
    for (let i = 0; i < 8; i++) {
      prices.push(min + i*(diff/7))
    }
    await this.setState({prices, max, min, diff}); 
  }
  componentDidMount = async() => {
    await this.setCurrency('BTC/USDT'); 
  }
  render() {
    const currOptions = [
      {base: 'BTC', comp: 'USDT'},
      {base: 'BTC', comp: 'USD'}, 
      {base: 'ETH', comp: 'USDT'}, 
      {base: 'ETH', comp: 'BTC'}, 
      {base: 'LTC', comp: 'BTC'}
    ]
    const timeOptions = ["weekly", "daily", "realTime"]; 
    return (
      <div className="App">
        <div className = "container"> 
          <h2 className = "mt-4 mb-5"> Cryptocurrency Exchange App </h2> 
          <div className = "mt-3" style = {{width: 300, display: 'flex'}}> 
            <h5 className = "mr-3"> Exchange </h5> 
            <select className = "form-control" onChange = {(e) => this.setCurrency(e.target.value)}> 
              {currOptions.map((option, key) => (
                <option key = {key}> 
                  {option.base}/{option.comp} 
                </option>
              ))}
            </select> 
          </div> 
          <div className = "mt-3" style = {{width: 300, display: 'flex'}}> 
            <h5 className = "mr-3"> Time </h5> 
            <select className = "form-control" onChange = {(e) => this.setTime(e.target.value)}> 
              {timeOptions.map((option, key) => (
                <option key = {key}> {option} </option> 
              ))}
            </select> 
          </div> 
          <div id = "chart" className = "mt-4"> 
            <div className = "row p-0 m-0" style = {{height: '90%'}}> 
              <div className = "col-1" style = {{display: 'flex', justifyContent: 'space-between', flexDirection: 'column-reverse', alignItems: 'flex-start'}}> 
                {this.state.prices.map((price, key) => (
                  <p key = {key}> {price.toPrecision(5)} </p>
                ))}
              </div> 
              <div className = "col-9" style = {{display: 'flex', justifyContent: 'space-around'}}> 
                {this.state[this.state.view].map((point, key) => (
                  <ChartElement max = {this.state.max} diff = {this.state.diff} point = {point} key = {key}/>
                ))} 
              </div> 
              {this.state.loaded ? 
                <div className = "col-2 m-0 p-0" style = {{display: 'flex', justifyContent: 'space-between'}}> 
                  <RealTime 
                    addMinute = {this.addMinute} 
                    setMinutes = {this.setMinutes} 
                    max = {this.state.max} 
                    diff = {this.state.diff} 
                    curr = {this.state.currency} 
                    min = {this.state.min} 
                    setRange = {this.setRange}/> 
                </div> : null 
              }
            </div> 
            <div className = "row pt-3 m-0" style = {{height: '10%'}}> 
              <div className = "col-1"/> 
              <div className = "col-9" style = {{display: 'flex', justifyContent: 'space-around', fontSize: 14}}>  
                {this.state[this.state.view].map((point, key) => (
                  <div key = {key}> 
                    {this.state.view === "realTime" ?
                      point.time.getMinutes() % 5 === 0 ? 
                        <p> {point.time.getHours()}:{point.time.getMinutes() < 10 ? 
                          '0' + point.time.getMinutes() : point.time.getMinutes()} </p>  
                        : null 
                      :
                      <p> {point.time.split('T')[0].split('-')[1] + '/' + point.time.split('T')[0].split('-')[2]} </p> 
                    }
                  </div > 
                ))}
              </div> 
            </div> 
          </div> 
        </div> 
      </div>
    );
  }
}

export default App;
