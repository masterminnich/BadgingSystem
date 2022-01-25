import React, { Component, useState } from 'react';

function fetchAllStats(activtiesCollection){
    //console.log("activities",activtiesCollection)

    function getActivityDay(dateObj){
        let DateStr = dateObj.getFullYear()+"-"+dateObj.toISOString().substring(5,7)+"-"+dateObj.toISOString().substring(8,10); //YYYY-MM-DD
        return DateStr
    }

    //Find Today's Stats
    let todayDateObj = new Date();
    let edt_offset = -5*60; 
    todayDateObj.setMinutes(todayDateObj.getMinutes() + edt_offset); //Convert UTC to local time
    let ActivityDate = getActivityDay(todayDateObj)
    let returnedVal = fetchDataOneDay(ActivityDate,activtiesCollection)

    //Find This Week's Stats
    let sundayDate = new Date();
    var dateOffset = (24*60*60*1000);
    let dayOfWeek = todayDateObj.getDay() //How many days into the week are we?
    sundayDate.setTime(todayDateObj.getTime() - dateOffset * dayOfWeek) //Find the beggining (Sunday) of the week

    //Get stats for each day of the week
    let thisWeekStats = {}
    for (let i = 0; i < dayOfWeek+1; i++) {
        let d3 = new Date();
        d3.setTime(sundayDate.getTime() + dateOffset * i)
        let ActivityDate = getActivityDay(d3)
        let returnedVal = fetchDataOneDay(ActivityDate,activtiesCollection)
        let dateNickName = d3.toString().substring(0,15)
        thisWeekStats[dateNickName] = returnedVal
    }

    //Find this Semester's Stats

    //Find all stats. Compiles all activities in the DB.
    let allStats = {}
    for (let j = 0; j < activtiesCollection.length; j++) {
        let dateStr = activtiesCollection[j].Date
        let returnedVal = fetchDataOneDay(dateStr,activtiesCollection)
        allStats[dateStr] = returnedVal
    }

    // WOW, nesting these if statements was a terrible idea. I'm sorry future me that is reading this code. It takes the allStats object and adds up like properties.
    let cumStats = {"eventTypeCount":{}}
    for(const date in allStats){
        let oneDayOfData = allStats[date]
        for(const prop in oneDayOfData){
            if(prop=="eventTypeCount"){ //If the property is eventType, unpack it further.
                for(const eventType in oneDayOfData["eventTypeCount"]){
                    if(cumStats["eventTypeCount"][eventType] == undefined){ //If the property hasn't been instatiated, set its value
                        cumStats["eventTypeCount"][eventType] = oneDayOfData["eventTypeCount"][eventType]
                    } else { //If the property has been instantiated, take its current value and add the next value.
                        cumStats["eventTypeCount"][eventType] = cumStats["eventTypeCount"][eventType] + oneDayOfData["eventTypeCount"][eventType]
                    }
                }
            } else {
                if(cumStats[prop] == undefined){ //If the property hasn't been instatiated, set its value
                    cumStats[prop] = 0
                } else { //If the property has been instantiated, take its current value and add the next value.
                    cumStats[prop] = cumStats[prop] + oneDayOfData[prop]
                }
            }
        }
    }
    // avgSessionMinutes needs to be recalculated. Because of the code above avgSessionMinutes = Sum(avgDay1 + avgDay2...). Instead it should take cumSessionMinutes and divide by total visits.
    cumStats["avgSessionMinutes"] = cumStats["cumSessionMinutes"]/cumStats["Total visits"]

    //Print stats to console
    console.log("Today's Stats:",returnedVal)
    console.log("thisWeekStats:",thisWeekStats)
    console.log("All Stats:",allStats)
    console.log("cumStats:",cumStats)
}

const fetchDataOneDay = (ActivityDate,activitiesCollection) =>{
    let collectedStats = {
        "Total visits":0,
        "cumSessionMinutes":0,
        "avgSessionMinutes":0,
        "eventTypeCount":{}
    };

    let ActivityDay = activitiesCollection.find(a => a.Date == ActivityDate)

    if(ActivityDay !== undefined){
        let numberEvents = ActivityDay.Events.length
        collectedStats["Total visits"] = numberEvents;

        //Calculate the cummulative amount of session minutes
        let cumSessionMinutes = 0;
        ActivityDay.Events.forEach(event => cumSessionMinutes += event.sessionLengthMinutes)
        collectedStats["cumSessionMinutes"] = cumSessionMinutes;

        let avgSessionMinutes = cumSessionMinutes / numberEvents
        collectedStats["avgSessionMinutes"] = avgSessionMinutes;

        //Count each type of visit.
        let eventTypeCount = {"Undefined":0,"Individual":0,"Certification":0,"Class":0,"Quick Visit":0,"New Member Registered":0}
        ActivityDay.Events.forEach(event => eventTypeCount[event.event] += 1)
        collectedStats["eventTypeCount"] = eventTypeCount;

    } else { console.log("No activities found with date",ActivityDate) }
    return collectedStats
}

const getActivitiesCollection = async () => {
    try {
        const res = await fetch('/api/activity', {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
        })
        let response = res.json();
        response.then((resp) => {
            fetchAllStats(resp.data);
        })
    } catch (error) { console.log("error @ getActivitiesCollection(): ",error); }
}

getActivitiesCollection();

class App extends Component {
    state = {};

    render() {
        return (
            <>
                <h1>Stats</h1>
                <p>Day, Week, Semester</p>
                <p>Cummulative Hours, Avg Session Length, Device Popularity, Unique Member visits, New registrants</p>
            </>
        );
    }
}
export default App;