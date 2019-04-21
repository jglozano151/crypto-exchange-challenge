import React, { Component } from 'react'; 

export default class ChartElement extends Component {
    render() {
        let {max, diff, point} = this.props; 
        return (
            <div style = {{
                position: 'relative', 
                top: `${((max - point.high)/diff)*100}%`,
                height: `${((point.high - point.low)/diff)*100}%`,
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                zIndex: 5
            }}>
                <div style = {{
                    height: `${((point.high - point.q3)/(point.high - point.low))*100}%`,
                    width: 1,
                    background: 'green' 
                }}/>
                <div style = {{
                    height: `${((point.q3 - point.q1)/(point.high - point.low)*100)}%`,
                    width: 7, 
                    background: 'green',
                    borderRadius: 5
                }}/>
                <div style = {{
                    height: `${((point.q1 - point.low)/(point.high - point.low))*100}%`,
                    width: 1,
                    background: 'green' 
                }}/>
            </div> 
        )
    }
}