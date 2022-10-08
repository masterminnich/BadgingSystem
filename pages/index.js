import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import React, { Component, useState, useEffect } from 'react';
import { Button, Form } from 'semantic-ui-react';


let hoverTimerId;
let isHovering = false; //Whether the user is currently hovering over an element of interest
const certFullNameList = ['UltimakerCertified', 'GlowforgeCertified', 'FourAxisMillCertified', 'BantamMillCertified', 'P9000Certified', 'SewingCertified', 'SilhouetteCertified', 'FusionCertified', 'VectorCADCertified', 'CircuitDesignCertified',"IndustrialSewingCertified"];
let certNameList = ["FourAxisMill","BantamMill","Glowforge","P9000","Sewing","Silhouette","Ultimaker","Fusion","VectorCAD","CircuitDesign","IndustrialSewing"]
let otherToolsNameList = ["ButtonPress","3D Scanners","WacomTablets","VR","Comb Binder","Hand Tools"]
const localDateTimeOptions = {year:"numeric","month":"2-digit", day:"2-digit",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"}
const headers = {"Accept": "application/json", "Content-Type": "application/json"}

function getMachinesUtilized(){ //Get list of machinesUtilized from an on-screen PopUp
  let machinesUtilized = []
  let machinesFieldset = document.getElementById("machinesUtilized")
  for(let i=0; i < machinesFieldset.children.length; i++){
    if (machinesFieldset.children[i].children[0].checked){
      machinesUtilized.push(machinesFieldset.children[i].children[0].name)
    }
  }
  return machinesUtilized
}

function getotherToolsUtilized(){ //Get list of otherToolsUtilized from an on-screen PopUp
  let otherToolsUtilized = []
  let otherToolsFieldset = document.getElementById("otherToolsUtilized")
  for(let i=0; i < otherToolsFieldset.children.length; i++){
    if (otherToolsFieldset.children[i].children[0].checked){
      otherToolsUtilized.push(otherToolsFieldset.children[i].children[0].name)
    }
  }
  return otherToolsUtilized
}

function ensureCertifications(form, member){
  console.log("member",member)
  if (form.event == "Certification"){
    for(let t=0;t<certFullNameList.length;t++){
      if (form.machineUtilized.includes(certNameList[t])){ member[certFullNameList[t]] = true }
    }  
  }
  return member
}

/* Start Tooltips Code */
function hover(params){ //Checks to see if an element has been hovered over for 2 seconds or more. params = [memberDataOrId, parentElement]. parentElement is the element is which the hover originated. 
  let memberDataOrId = params[0] 
  let parentElement = params[1].target
  isHovering = true 
  hoverTimerId = setTimeout(function() { //Start the timer
    if (isHovering){
      createMemberTooltip(memberDataOrId,parentElement)
    }
  }, 1500)
}

function hoverOut(){ //Resets timer when done hovering over an element.
  isHovering = false 
  clearTimeout(hoverTimerId)

  //Delete all tooltips if they exist
  let tooltipsInTheDOM = document.getElementsByClassName("tooltip")
  for (let i=0;i<tooltipsInTheDOM.length;i++){ tooltipsInTheDOM[0].remove() }
}

function createTooltip(dataToDisplay,parentElement){
  let span = document.createElement("span")
  span.className = "tooltip"
  let arrow = document.createElement("div")
  arrow.className="tooltipArrow"
  span.appendChild(arrow);
  let dataToDisplayKeys = Object.keys(dataToDisplay) //The keys are the name of the attribute to be printed
  for (let i=0;i<dataToDisplayKeys.length;i++){ //Create a seperate p element for each attribute.
    let value = dataToDisplay[dataToDisplayKeys[i]]
    let p1 = document.createElement("p")
    let p2 = document.createElement("p")
    let div = document.createElement("div")
    p1.innerText = dataToDisplayKeys[i]+": "
    p1.id = "tooltip_info_p1"+dataToDisplayKeys[i]
    p1.className = "tooltip_attribute"
    p2.innerText = String(value)
    p2.id = "tooltip_info_p2"+dataToDisplayKeys[i]
    p2.className = "tooltip_attribute"
    div.appendChild(p1)
    div.appendChild(p2)
    span.appendChild(div)
  }
  parentElement.appendChild(span)
}

const getMemberDataFromID = async (MemberID,parentElement) => { //Fetch member data from MongoDB for a specific member
  try {  
    const res = await fetch(`/api/members/${MemberID}`, {
        method: 'GET',
        headers: headers
    })
    let response = res.json();
    response.then((resp) => {
      let memberData = resp.data
      let dataToDisplay;
      if (memberData !== undefined){  
        dataToDisplay = {"Patron Type":memberData["PatronType"],"Major":memberData["Major"],"GraduationYear":memberData["GraduationYear"],"RFID UID":memberData["rfid"],"joinedDate":new Date(memberData["joinedDate"]).toLocaleString("en-CA", localDateTimeOptions)}
        console.log("memberData",memberData)
      } else { //Create Tooltip for users not in the members collection
        dataToDisplay = {"RFID UID":"N/A"}
      }
      createTooltip(dataToDisplay,parentElement)
    })
  } catch (error) { console.log(error); }
}

function createMemberTooltip(memberDataOrId,parentElement){
  if (typeof(memberDataOrId) == "object"){ //memberDataOrId is a member object
    let dataToDisplay = {"Patron Type":memberDataOrId["member"].PatronType,"Major":memberDataOrId["member"].Major,"GraduationYear":memberDataOrId["member"].GraduationYear,"RFID UID":memberDataOrId["member"].rfid,"joinedDate":new Date(memberDataOrId["member"].joinedDate).toLocaleString("en-CA", localDateTimeOptions)}
    createTooltip(dataToDisplay,parentElement)
  } else { //memberDataOrId is member._id as a string
    getMemberDataFromID(memberDataOrId,parentElement);
  }
}
/* End Tooltips Code */

const updateMember = async (member) => {
  try {  
    const res = await fetch(`/api/members/${member._id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(member)
    })//.then(setTimeout(() => { window.location.reload() }, 200));
  } catch (error) { console.log("ERROR in updateMember() ",error); }
}

const updateActivityByDate = async (date, events) => {
  try {  
    const res = await fetch(`/api/activity`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({Date: date, Events: events})
    })//.then(setTimeout(() => { window.location.reload() }, 200));
  } catch (error) { console.log("ERROR :",error); }
}

const createNewActivity = async (date, events, originFn) => {
  try {
    const res = await fetch(`/api/activity`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({Date: date, Events: events})
    })//.then(setTimeout(() => { window.location.reload() }, 200));
  } catch (error) { console.log("ERROR in",originFn,":",error) }
}

//creates a new activity upon badge out
const updateActivityLog = async (activitiesCollection, newActivity, e, existing) => {
  // activity : The activities collection
  // newActivity: the activityEvent to update
  // existing : true = edit an activity that exists in the DB. false = add a new activity to the DB

  let newBadgeOutDate = newActivity.badgeOutTime.substring(0,10);
  let displayProps = JSON.parse(e.target["displayProps"].innerText);
  let prevBadgeOutDate = displayProps.displayDay;
  let newActivityDay = activitiesCollection.find(a => a.Date == newBadgeOutDate) //Get the activity document for the correct day
  let prevActivityDay = activitiesCollection.find(a => a.Date == prevBadgeOutDate)

  let newActivities;

  if (existing !== false){ //Updating an existing event
    //console.log('activity',activity,'newActivity',newActivity,'newActivityDay',newActivityDay);

    if (prevBadgeOutDate !== newBadgeOutDate){ //Check if the activity is being moved to another date.
      //Date of the activity has changed. Delete the event from the old activity.
      let prevActivityEvents = prevActivityDay.Events.filter(a => a._id !== newActivity._id)
      updateActivityByDate(prevBadgeOutDate, prevActivityEvents); //Delete activity from old date
      
      if (newActivityDay){ //If activities exist for this day, update the list. 
        newActivities = newActivityDay.Events.concat(newActivity)
      }

      //finish: check to update member.lastBadgeOut
    } else { //Event is not being moved to a different day. Edited single activity.
      let DayEvents = newActivityDay.Events.filter(a => a._id !== newActivity._id) //Remove the event from the ActivityDaily document so we can add it back in.
      newActivities = DayEvents.concat(newActivity); //All events from the day.
    }
  } else {
    if (newActivityDay){ //Activities exist for this day... updating existing activity list
      let acitivitiesBefore = newActivityDay.Events
      newActivities = acitivitiesBefore.concat(newActivity);
    }
  }

  //Add events to the DB
  if (newActivityDay){
    updateActivityByDate(newBadgeOutDate,newActivities)
  } else { 
    createNewActivity(newBadgeOutDate,newActivity)
  }
}

export default function Home({ members, activities, config }){
  const [state, setState] = useState({
    configCollection: config[0],
    membersCollection: members,
    activitiesCollection: activities,
    displayingDay: new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10),
    isOpen: false,
    activityEvent: "",
    displayProps: {},
    batchEvents: [],
    submitType: {},
    showConfigPopup: false,
    showForgotIDPopup: false,
  });

  //console.log("state",state)

  function toggleConfigPopup(){ setState({...state, showConfigPopup: !state.showConfigPopup}); }

  /*function validate(e) {
    let err = {};
    let reqVariables = ['MemberID', 'Name','badgeInTime','badgeOutTime', 'event'];
    
    for (let i = 0; i < reqVariables.length; i++) {
      if (e.target[reqVariables[i]].value == "") {
        err[reqVariables[i]] = reqVariables[i]+" is required";
      }
    }

    if (e.target.sessionLengthMinutes.value == NaN){
      err.sessionLengthMinutes = "sessionLengthMinutes cannot be NaN"
    }
    return err;
  }*/

  const deleteActivity = async(props) => {
    let [activitiesCollection, popUpState, activityID, member] = props
    console.log("p",props)
    let date = popUpState.badgeOutDate.substring(0,10)
    let activityDay;
    let remainingActivities;
    if(typeof(activityID)=="string"){
      activityDay = activitiesCollection.find(a => a.Date == date)
      remainingActivities = activityDay.Events.filter(a => a._id !== activityID)
    } else if (activityID == undefined){ //delete from badgeOut Screen
      member.badgedIn = !member.badgedIn
      updateMember(member)
    } else { //list of IDs
      console.log("FIX BATCH DELETE from deleteActivity()")
    }
    updateActivityByDate(date, remainingActivities, "deleteActivity")
    setState({...state, isOpen: false}); //close the popup
  }

  const badgeInByRFID = async (RFID_UID_input) => {
    try {
      const res = await fetch('/api/badgeIn', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({rfid: RFID_UID_input})
      }).then(setTimeout(() => { window.location.reload() }, 200));
      let response = res.json();
      response.then((resp) => {
        console.log(resp.data);
      });
    } catch (error) { console.log("Error badging in member",error) }
    setState({...state, isOpen: false}); //close the popup
  }


  class QuestionTooltip extends React.Component{
    render(){
      return(
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-question-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
          </svg>
        </>
      )
    }
  }

  class VisitType extends React.Component{
    constructor(props){
      super(props);
      this.selectValue = this.props.selectValue;
    }

    VisitTypeChange(e){ this.props.onChange(e.target.value) }
    
    render(){
      return(
        <>
          <div id="visitType" style={{"display":"flex"}}>
            <label htmlFor="event">Visit Type: </label>
            <select onChange={(e) => this.VisitTypeChange(e)} defaultValue={this.selectValue} name="event">
              <option value="Undefined">Undefined</option>
              <option value="Individual">Personal Project</option>
              <option value="Certification">Certification</option>
              <option value="Homework / Class Project">Homework / Class Project</option>
              <option value="Quick Visit">Quick Visit</option>
              <option value="Class">Class</option>
              <option value="Event">Event</option>
              <option value="Staff on Duty">Staff on Duty</option>
            </select>
            <QuestionTooltip id="VisitTypeQuestion"/>
          </div>
        </>
      )
    }
  }

  const batchEdit = (e,selected) => {
    let date = document.getElementById("date").innerText
    let editDate = state.activitiesCollection.filter(a => a.Date== date)[0]
    let eventIdsToEdit = []; //list of event ids to delete
    selected.forEach(item => eventIdsToEdit.push(item.parentNode.parentNode.id)) //Get a list of event ids to delete
    let eventsToEdit = editDate.Events.filter(e => eventIdsToEdit.includes(e._id))
    let eventInfo = eventsToEdit[0];
    console.log("EventsToEdit",eventsToEdit)
    //needs to find and pass batchEventsToEdit
    /*setState({
      ...state,
      batchEvents: eventsToEdit,
    })
    console.log("EventsToEdit",eventsToEdit)*/
    let message = "Editing ("+eventIdsToEdit.length+") events..."
    openBatchEditPopUp(eventsToEdit,eventInfo,{submitButtonText:"Batch Update","message":message}, "() => this.batchEdit()") 
  }

  const batchDelete = (e,selected) => {
    let date = document.getElementById("date").innerText
    let deleteDate = state.activitiesCollection.filter(a => a.Date== date)[0]
    let eventIdsToDelete = []; //list of event ids to delete
    selected.forEach(item => eventIdsToDelete.push(item.parentNode.parentNode.id)) //Get a list of event ids to delete
    let eventsToKeep = deleteDate.Events.filter(e => !eventIdsToDelete.includes(e._id))
    //console.log("e",e,"selected",selected,"eventsToKeep",eventsToKeep,"toDelete",eventsToDelete)
    updateActivityByDate(date, eventsToKeep, "batchDelete")
    setState({...state, isOpen: false}); //close the popup
  }

  const handleSubmitPopUp = (existingInDB, e) => { //handleSubmitBadgeOut
    //console.log("existingInDB",existingInDB,"e",e)
    let newActivity = state.activityEvent
    newActivity.badgeInTime = new Date(e.target.badgeInDate.value+" "+e.target.badgeInTime.value+" EDT").toISOString()
    newActivity.badgeOutTime = new Date(e.target.badgeOutDate.value+" "+e.target.badgeOutTime.value+" EDT").toISOString()
    newActivity.machineUtilized = getMachinesUtilized()
    newActivity.otherToolsUtilized = getotherToolsUtilized()
    newActivity.event = e.target[0].value
    newActivity.sessionLengthMinutes = Math.round(new Date(state.activityEvent.badgeOutTime) - new Date(state.activityEvent.badgeInTime))/60000
    newActivity.MemberID = state.activityEvent.MemberID
    newActivity._id = state.activityEvent._id
    newActivity.flags = state.activityEvent.flags
    updateActivityLog(state.activitiesCollection, newActivity, e, existingInDB)
    let memberToUpdate = state.membersCollection.filter(m => m._id == state.activityEvent.MemberID)[0]
    if (existingInDB == false){ memberToUpdate.badgedIn = false }
    if (newActivity.event == "Certification"){
      newActivity.machineUtilized.forEach(c => memberToUpdate[c+"Certified"] = true) //memberToUpdate[c]
    }
    //if memberToUpdate is undefinded it could be because its a ghost activity. No need to update the member.
    //How can we detect if this is a noID activity.
    if(newActivity.flags.includes("noID")){ console.log("no need to update member...") }
    console.log("memberToUpdate",memberToUpdate)
    //finish: check whether to update lastBadgeIn
    updateMember(memberToUpdate)
    setState({...state, isOpen: false}); //close the popup
  }

  const handleSubmitForgotID = (props,e) => {
    console.log("props",props)
    //let displayProps = JSON.parse(e.target[24].innerText);
    //let hiddenProps = JSON.parse(e.target[25].innerText);
    let numOfMembers = e.target.parentNode.children[2].children[1].value
    let newActivities = []
    for (let i=0; i<numOfMembers; i++){
      let newActivity = {
        Name: document.getElementById("member"+i).value,
        flags: ["noID"],
        badgeInTime: props.badgeInTime,
        badgeOutTime: props.badgeOutTime,
        event: props.event,
        machineUtilized: getMachinesUtilized(),
        otherToolsUtilized: getotherToolsUtilized(),
        sessionLengthMinutes: Math.round(new Date(props.badgeOutTime) - new Date(props.badgeInTime))/60000   
      }
      newActivities.push(newActivity)
    }
    let date = newActivities[0].badgeOutTime.substring(0,10)
    console.log("updating Activities collection...  newActivities=",newActivities)
    let activityDay = state.activitiesCollection.filter(a => a.Date == date)[0]
    console.log("activityDay",activityDay,"newActivities",newActivities)
    if (activityDay){
      let oldEvents = activityDay.Events
      let activities = oldEvents.concat(newActivities)
      updateActivityByDate(date, activities, "handleSubmitForgotID")
    } else { createNewActivity(date, newActivities, "handleSubmitForgotID") }

    setState({...state, isOpen: false}); //close the popup
  }

  const closePopup = async() => {
    setState({
      ...state, 
      isOpen: false,
      showForgotIDPopup: false,
    });
    if(state.isOpen == false){ document.getElementsByClassName("Popup")[0].remove() }
  }

  class Popup extends React.Component{
    constructor(props) {
      super(props);
      let visitType;
      if(state.activityEvent.event){ visitType = state.activityEvent.event } else { visitType = "Undefined" }
      this.state = {
        badgeInDate: this.props.badgeInDate,
        badgeInTime: this.props.badgeInTime,
        badgeOutDate: this.props.badgeOutDate,
        badgeOutTime: this.props.badgeOutTime,
        visitType: visitType,
      }
    }

    updateBadgeInDate(item){ this.setState({"badgeInDate": item.target.value}) }
    updateBadgeInTime(item){ this.setState({"badgeInTime": item.target.value}) }
    updateBadgeOutDate(item){ this.setState({"badgeOutDate": item.target.value}) }
    updateBadgeOutTime(item){ this.setState({"badgeOutTime": item.target.value}) }
    handleMachineUtilized(value){ this.setState({"machineUtilized": value}) }
    handleOtherToolsUtilized(value){ this.setState({"otherToolsUtilized": value}) }
    handleVisitType(value){ this.setState({"visitType": value}) }

    batchEdit(){
      let activityInfo = this.getInfo()
      let date = activityInfo.badgeOutTime.substring(0,10)
      let editedEvents = [];
      let eventIDList = []; //List of _id of each edited event
      let eventIDsToDelete = [];
      let dayMovingFromL = [];
      console.log("state",state,"activityInfo",activityInfo)
      for (let i=0; i<state.batchEvents.length; i++){
        let editedEvent = {};
        editedEvent.sessionLengthMinutes = activityInfo.sessionLengthMinutes;
        editedEvent.badgeInTime = activityInfo.badgeInTime
        editedEvent.badgeOutTime = activityInfo.badgeOutTime
        editedEvent.machineUtilized = this.state.machineUtilized
        editedEvent.otherToolsUtilized = this.state.otherToolsUtilized
        editedEvent.event = this.state.visitType
        editedEvent.Name = state.batchEvents[i].Name
        editedEvent.MemberID = state.batchEvents[i].MemberID
        editedEvent._id = state.batchEvents[i]._id
        editedEvent.flags = state.batchEvents[i].flags
        editedEvents.push(editedEvent)
        eventIDList.push(state.batchEvents[i]._id)
        let dayMovingFrom = state.batchEvents[i].badgeOutTime.substring(0,10)
        if (dayMovingFrom !== activityInfo.badgeOutTime.substring(0,10)){ 
          eventIDsToDelete.push(state.batchEvents[i]._id) 
          dayMovingFromL.push(dayMovingFrom)
        }
      };
      //updateActivityLog(activitiesCollection, newActivity, e, existing)
      let activityDay = state.activitiesCollection.filter(a => a.Date == date)[0]//Get previous events
      if (activityDay){
        let oldEvents = activityDay.Events
        console.log("oldEvents",oldEvents,"date",date,"displayingProps",state.displayProps)
        oldEvents = oldEvents.filter(e => !eventIDList.includes(e._id))//remove edited Events
        console.log("editedEvents",editedEvents)
        editedEvents = editedEvents.concat(oldEvents)
        console.log("updateAcitivtyByDate() editiedevents",editedEvents)
        updateActivityByDate(date,editedEvents,"Popup.batchEdit()")
        if (eventIDsToDelete){ //delete oldEvents if moving
          console.log("moving events to another day... removing original events.")
          let origActivityDay = state.activitiesCollection.filter(a => a.Date == dayMovingFromL[0])[0]
          let keepEvents = origActivityDay.Events.filter(e => !eventIDsToDelete.includes(e._id))
          updateActivityByDate(dayMovingFromL[0], keepEvents, "moving events to another day...")
        }
      } else { 
        console.log("about to created activity w/ editedEvents",editedEvents)
        createNewActivity(date, editedEvents, "Popup.batchEdit()") }
    }

    getInfo(){
      let badgeInTime = new Date(this.state.badgeInDate+" "+this.state.badgeInTime+" EDT");
      let badgeOutTime = new Date(this.state.badgeOutDate+" "+this.state.badgeOutTime+" EDT");
      let activityInfo = {
        badgeInTime: badgeInTime.toISOString(),
        badgeOutTime: badgeOutTime.toISOString(),
        event: this.state.visitType,
        machineUtilized: getMachinesUtilized(),
        otherToolsUtilized: getotherToolsUtilized(),
        //_id:
        sessionLengthMinutes: Math.round(badgeOutTime - badgeInTime)/60000
      }
      console.log("this.getInfo()| this.props",this.props,"activityInfo",activityInfo)
      return activityInfo
    }
    
    render(){
      //console.log("popup props",this.props,"batchEvents type",batchEvents)
      let trashButtonCSS = {"display": "block"}
      if(this.props.noId && this.props.noId == true){ trashButtonCSS = {"display": "none"} }
      if(state.batchEvents.length > 0){ trashButtonCSS = {"display": "none"} }
      return (
        <>
          <h1 id="badgingOutTitle">{this.props.message}</h1>
          <Form onSubmit={eval(state.submitType)}>
            <VisitType onChange={this.handleVisitType.bind(this)} selectValue={state.activityEvent.event}/>
            <div id="badgeInTime" style={{display: "flex"}}>
              <label htmlFor="badgeInTime">Badged In: </label>
              <input onChange={value => this.updateBadgeInDate(value)} id="badgeInDate" type="date" className="date" defaultValue={this.props.badgeInDate}></input>
              <input onChange={value => this.updateBadgeInTime(value)} id="badgeInTime" type="time" className="time" defaultValue={this.props.badgeInTime}></input>
            </div>
            <div id="badgeOutTime" style={{display: "flex"}}>
              <label htmlFor="badgeOutTime">Badged Out: </label>
              <input onChange={value => this.updateBadgeOutDate(value)} id="badgeOutDate" type="date" className="date" defaultValue={this.props.badgeOutDate}></input>
              <input onChange={value => this.updateBadgeOutTime(value)} id="badgeOutTime" type="time" className="time" defaultValue={this.props.badgeOutTime}></input>
            </div>

            <div className="equipment">
              <MachinesUtilized onChange={this.handleMachineUtilized.bind(this)}/>
              <OtherToolsUtilized onChange={this.handleOtherToolsUtilized.bind(this)}/>
            </div>

            <textarea style={{display:"none"}} id="displayProps" defaultValue={JSON.stringify(state.displayProps)}></textarea>
            <textarea style={{display:"none"}} id="hiddenProps" defaultValue={JSON.stringify(this.props)}></textarea>

            <Button type='button' name={state.activityEvent._id} id="deleteActivityButton" onClick={(e) => deleteActivity([state.activitiesCollection, this.state, state.activityEvent._id, state.activityEvent.member])} style={trashButtonCSS}></Button>
            <Button type='submit' id="submitBadgeOutPopup" onClick={this.props.submitting}>{this.props.submitButtonText}</Button>
            <Button type='button' id="cancelPopupButton" onClick={() => closePopup()}>Cancel</Button>
          </Form>
        </>
      )
    }
  }

  function badgeOutManually(member){
    setState({
      ...state,
      activityEvent: {
        badgeInTime: new Date(member.lastBadgeIn).toISOString(),
        badgeOutTime: new Date().toISOString(), 
        Name: member.Name,
        MemberID: member._id,
        member: member,
        flags: [],
      },
      displayingProps: {
        submitButtonText:"Badge Out",
        message:"Badging out "+member.Name+"..."
      },
      submitType: "(e) => handleSubmitPopUp(false,e)", //badgeInByRFID
      isOpen: true,
    })
  }

  const openBatchEditPopUp = async (eventsToEdit,eventInfo,displayProps,submitFn) => {
    setState({
      ...state,
      activityEvent: eventInfo,
      batchEvents: eventsToEdit,
      submitType: submitFn,
      displayProps: displayProps,
      isOpen: true,
    })
  }

  const openPopUp = async (actEvent,displayProps,submitFn) => {
    setState({
      ...state,
      activityEvent: actEvent,
      submitType: submitFn,
      displayProps: displayProps,
      isOpen: true,
    })
  }

  const certificationNames = ['Ultimaker','Glowforge','Four Axis Mill', 'Bantam Mill', 'P9000', 'Sewing', 'Silhouette', 'Fusion', 'VectorCAD', 'CircuitDesign'];

  class MachinesUtilized extends React.Component{
    constructor(props){
      super(props);
      if(typeof(state.activityEvent.machineUtilized)!=="undefined"){
        this.state = { machines: state.activityEvent.machineUtilized } //List of machines utilize
      } else { 
        this.state = { machines: [] } //List of machines utilize
      }
    }

    MachineUtilizedChange(e){ 
      this.props.onChange(this.state.machines) 
    }

    updateState = (e) => {
      let machinesInUse = this.state.machines
      if (e.target.checked){  
        machinesInUse.push(e.target.id) 
      } else {  
        machinesInUse = machinesInUse.filter(m => m !== e.target.id)
      }
      this.setState({"machines":machinesInUse})
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes" style={{display:'flow-root', width: "50%"}}>
            <p>Machines Utilized (Certification Required):</p>
            <fieldset onChange={(e) => this.MachineUtilizedChange(e)} id="machinesUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              {certNameList.map((CertName) => 
                <label htmlFor={CertName} key={"label_"+CertName}>
                  <input type="checkbox" id={CertName} name={CertName} defaultChecked={this.state.machines.includes(CertName)}></input>
                  {CertName}
                </label>
              )}
            </fieldset>
          </div>
        </>
      )
    }
  }

  class OtherToolsUtilized extends React.Component{
    constructor(props){
      super(props);
      if(typeof(state.activityEvent.otherToolsUtilized)!=="undefined"){
        this.state = { otherTools: state.activityEvent.otherToolsUtilized } //List of other tools that don't require certification
      } else { 
        this.state = { otherTools: [] } //List of other tools that don't require certification
      }
    }

    OtherToolsUtilizedChange(e){ this.props.onChange(this.state.otherTools) }

    updateState = (e) => {
      let otherTools = this.state.otherTools
      if (e.target.checked){  
        otherTools.push(e.target.id) 
      } else {  
        otherTools = otherTools.filter(m => m !== e.target.id)
      }
      this.setState({"otherTools":otherTools})
    }

    render(){
      return(
        <>
          <div onClick={this.updateState} className="checkboxes" style={{display:'flow-root', width: "50%"}}>
            <p>Other Tools Utilized (No Certification Required):</p>
            <fieldset onChange={(e) => this.OtherToolsUtilizedChange(e)} id="otherToolsUtilized" style={{"display": "inline-block","position": "relative","textAlign": "initial","float":"left","border":"none"}}>
              {otherToolsNameList.map((ToolName) => 
                <label htmlFor={ToolName} key={"label_"+ToolName}>
                  <input type="checkbox" id={ToolName} name={ToolName} defaultChecked={this.state.otherTools.includes(ToolName)}></input>
                  {ToolName}
                </label>
              )}
            </fieldset>
          </div>
        </>
      )
    }
  }

  class BadgeInForgotIDPopUp extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        members: [0], //An array whose number of elements corresponds to the number of members being badged in.
      }
    }

    numOfMembersChanged(){
      let numMembersInput = document.getElementById("numMembersToBadgeIn")
      let arr = Array.from(Array(parseInt(numMembersInput.value)).keys())
      this.setState({members:arr});
    }

    render(){
      return(
        <>
          <section className="Popup">
            <Popup
              badgeInDate={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              badgeInTime={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              badgeOutDate={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              badgeOutTime={new Date().toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              message={"Creating anonymous activity..."}
              submitButtonText="Create"
              existsInDB={false}
              noId={true}
              submitting={this.props.toggle}
            />

            <div>
              <p style={{"display": "inline"}}>Members: </p>
              <input type="number" min="1" max="35" defaultValue="1" id="numMembersToBadgeIn" onChange={this.numOfMembersChanged.bind(this)} style={{"display": "inline"}}></input> 
            </div>

            <div style={{"display":"flow-root", "overflowY":"scroll", "maxBlockSize":"7vw"}}>
              { this.state.members.map((member,i) => 
                <label className="enterInfoLabel" htmlFor={"member"+i} style={{"marginBottom":"4px", display:"block"}} key={"member"+i}>Name:
                  <input type="text" id={"member"+i} defaultValue={"Unknown Member"} style={{"display":"inline-block", "position":"absolute", "left":"7ch", "width": "30ch"}}></input>
                </label>
              )}
            </div>
          </section>
        </>
      )
    }
  }

  class BadgeInForgotIDButton extends React.Component{
    constructor(props){
      super(props);
    }

    toggle(){ 
      setState({ 
        ...state,
        submitType: "(e) => handleSubmitForgotID(this.getInfo(),e)" ,
        showForgotIDPopup: !state.showForgotIDPopup,
      })
    }

    render(){
      return(
        <>
          <button onClick={() => this.toggle()} type="button">Forgot ID</button>
          {state.showForgotIDPopup ? 
            <BadgeInForgotIDPopUp/>
            : <div></div>
          }
        </>
      )
    }
  }

  class SearchMemberBadgeIn extends React.Component{
    constructor(props){
      super(props);
      this.state = {
        results: [],
        showResults: false,
        selectionMade: false,
        selection: "",
        showEditMemberPopup: false,
      }
    }

    onKeyUpCapture(e){
      function BadgeInMemberSearch(members){
        //Searches for a member by name, then badges in the member.
        let searchInput = e.target.value
        let listOfMembers = members.map(x => [x.Name,x._id,x.rfid])
        const regexSearch = new RegExp("(.*"+searchInput+".*)","i") //Create a regex rule to match the search input exactly and capture the entire names of any matching searches. i flag ignores case sensitivity.
        const memberNamesMatchingSearch = listOfMembers.filter(memberName => regexSearch.test(memberName[0]));
        //console.log("members:",memberNamesMatchingSearch)
        return memberNamesMatchingSearch
      }

      let searchResults = BadgeInMemberSearch(this.props.members)
      this.setState({results:searchResults})
    }

    onFocus(e){ //When the user focuses on the search bar show the search results
      this.setState({showResults:true})
    }

    onBlur(e){ //When the user stops focusing on the search bar hide the search results
      setTimeout(() => { this.setState({showResults:false}) }, 200);
    }

    handleSelect(e){
      setTimeout(() => { 
        this.setState({selection:[e.target.innerText,e.target.id], selectionMade:true})
        document.getElementById("searchMemberBadgeIn").value = e.target.innerText
      }, 200);
    }

    handleSubmit(e){
      console.log("Badging in Member",this.state.selection[0],"w/ RFID UID:",this.state.selection[1])
      badgeInByRFID(this.state.selection[1])
    }
    
    render(){
      return(
        <>
        {this.state.showEditMemberPopup ? 
          <EditMemberPopup rfid={this.state.selection[1]} cancel={() => this.setState({showEditMemberPopup: false})}/>
          : <div></div>
        }

        <div style={{"textAlign": "center"}}>
        <p style={{display: "inline"}}>Search members: </p>
        <input onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)} onKeyUpCapture={this.onKeyUpCapture.bind(this)} id='searchMemberBadgeIn'></input> 
        <BadgeInForgotIDButton/>
        {this.state.showResults && this.state.results.length > 0 ? 
          <SearchResults handleSelect={this.handleSelect.bind(this)} results={this.state.results}></SearchResults>
          :  <div></div> }
        {this.state.selectionMade ? 
          <>
            <SubmitSelection result={this.state.selection} handleSubmit={this.handleSubmit.bind(this)} selectionMade={this.state.selection[0]}></SubmitSelection>
            <button type="button" onClick={() => this.setState({showEditMemberPopup: true})}>Edit Member</button>
          </>
          : <div></div>}
        </div>
        </>
      ) 
    }
  }

  class SearchResults extends React.Component{
    constructor(props){
      super(props);
    }

    render(){
      return(
        <div className="searchResultsDropdown">
          {this.props.results?.map((result,i) => (
            <div id={result[2]} onClick={this.props.handleSelect} key={"searchResult"+i}>{result[0]}</div>  
          ))}
        </div>
      )
    }
  }

  class SubmitSelection extends React.Component{
    constructor(props){
      super(props);
      this.state = {}
    }

    render(){
      return(
        <button onClick={this.props.handleSubmit}>Badge In {this.props.selectionMade}</button>
      )
    }
  }

  class EditMemberPopup extends React.Component{
    constructor(props){
      super(props);
    }

    render(){
      let member = state.membersCollection.filter(mem => mem.rfid == this.props.rfid)[0]

      return(
        <>
          <section className="Popup">
            <p>EDITING MEMBER</p>

            <p>Name:</p>
            <input type="text" defaultValue={member.Name}></input>

            <p>RFID:</p>
            <input type="text" defaultValue={this.props.rfid}></input>

            <p>Major:</p>
            <select defaultValue={member.Major}>
              {state.configCollection.memberAttributes.majors.map((major) => 
                <option key={major}>{major}</option>
              )}
            </select>

            <p>PatronType:</p> 
            <select defaultValue={member.PatronType}>
              {state.configCollection.memberAttributes.patronTypes.map((patronType) => 
                <option key={patronType}>{patronType}</option>
              )}
            </select>

            <p>GraduationYear:</p>
            <select defaultValue={member.GraduationYear}>
              {state.configCollection.memberAttributes.graduationYears.map((gradYear) => 
                <option key={gradYear}>{gradYear}</option>
              )}
            </select>

            <p>CERTS:</p>
            <input type="text" defaultValue={"test"/*member.Certifications.toString()*/}></input>

            <button type="button" onClick={this.props.cancel}>Cancel</button>
            <button type="button">Update</button>
            <button type="button">Delete</button>
          </section>
        </>
      )
    }
  }

  class ConfigPopup extends React.Component{
    constructor(props){
      super(props);
    }

    render(){
      //let config = getConfig()

      return(
        <>
          <section className="Popup">
            <p>Editing Config</p>

            <p>Time Zone Settings</p>

            <p>Certifications: </p>
            <input type="text" value={state.configCollection.certifications.toString()}></input>

            <p>otherTools: </p>
            <input type="text" value={state.configCollection.otherTools.toString()}></input>

            <p>visitType: </p>
            <input type="text" value={state.configCollection.visitType.toString()}></input>

            <details>
              <summary>Member Attributes</summary>
              <p>Majors</p>
              <input type="text" value={state.configCollection.memberAttributes.majors.toString()}></input>
              <p>Patron Types</p>
              <input type="text" value={state.configCollection.memberAttributes.patronTypes.toString()}></input>
              <p>Graduation Years</p>
              <input type="text" value={state.configCollection.memberAttributes.graduationYears.toString()}></input>
            </details>

            <button type="button" onClick={this.props.cancel}>Cancel</button>
            <button type="button" onClick={console.log("update config collection (TODO)")}>Update</button>
          </section>
        </>
      )
    }
  }

  class AddInfoButton extends React.Component{
    constructor(props){
      super(props);
      this.state = { 
        lastCheckboxSelected: undefined 
      }
    }

    render(){
      return(
        <>
        {!this.props.showCheckbox && this.props.activity.event !== "Undefined" ? (
          <button onClick={this.props.clickedAddInfo} className="addInfo" style={{display:"flex",margin:"auto","height":"1.8em"}}>Add Info</button>
        ) : (
          (!this.props.showCheckbox && this.props.activity.event == "Undefined") ? ( 
            <button onClick={this.props.clickedAddInfo} className="addInfoAttn" style={{display:"flex",margin:"auto","height":"1.8em"}}>Add Info</button>
          ) : (
            <input className="addInfoCheckbox" id={this.props.index} onClick={this.props.clickedCheckbox} type="checkbox" style={{display:"flex",margin:"auto","height":"1.8em"}}></input>
          )
        )}
        </>
      )
    }
  }
  
  class RecentActivity extends React.Component {
    constructor(props) {
      super(props);     

      let displayingActivities = state.activitiesCollection.filter(act => act.Date == state.displayingDay)[0]

      //Sort the activities by badgeInTime
      if (typeof displayingActivities !== 'undefined'){ //Check to make sure the activity exists
        displayingActivities.Events.sort(function(a, b) {
          let dateA = new Date(a.badgeOutTime);
          let dateB = new Date(b.badgeOutTime);
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          return 0;
        });
      }

      this.state = {
        activity: state.activitiesCollection,
        displayingActivities: displayingActivities,
        toggle: false, //toggle batch selections on and off. If true, batch selections are on. 
        firstCheckboxSelected: undefined,
        selected: [] //A list of selected elements
      };
      //console.log("RecentActivity.state =",this.state)
    }

    changeDay(arg,dayToChange){
      let currDate = new Date(dayToChange)//new Date(this.state.displayingDay)
        if (arg == "forward-one-day"){
          currDate.setMinutes(currDate.getMinutes() + 24*60); //Change dateObj to the next day
        } else if (arg == "backward-one-day"){
          currDate.setMinutes(currDate.getMinutes() - 24*60); //Change dateObj to the previous day
        }
        let currDay = currDate.toISOString().substring(0,10);
        setState({...state, displayingDay: currDay})
    }
    
    checkboxClicked(e){
      function getSelectedActivites(){
        let checkboxElems = document.getElementsByClassName("addInfoCheckbox");
        let selected = []
        for(let i=0; i<checkboxElems.length; i++){
          if(checkboxElems[i].checked){
            selected.push(checkboxElems[i])
          }
        }
        return selected
      }

      //Detect multiple selection shift-clicks
      if (this.state.toggle){
          if (e.shiftKey && this.state.firstCheckboxSelected) { 
          let firstId = this.state.firstCheckboxSelected.id
          let secondId = e.target.id
          let checkboxElems = document.getElementsByClassName("addInfoCheckbox");
          let changeToState = checkboxElems[secondId].checked //
          for (let i=Math.min(firstId,secondId); i<Math.max(firstId,secondId); i++){
            checkboxElems[i].checked = changeToState;
          }
          let selected = getSelectedActivites()
          this.setState({firstCheckboxSelected: checkboxElems[secondId], selected: selected})
        } else {
          let selected = getSelectedActivites()
          this.setState({firstCheckboxSelected: e.target, selected: selected})
        }
      }
    }
    
    render() {
      return (
        <>
          <a id="activitiesForward" onClick={() => this.changeDay("forward-one-day",state.displayingDay)}></a>
          <a id="activitiesBackward" onClick={() => this.changeDay("backward-one-day",state.displayingDay)}></a>
          <table id="recentActivity">
            <caption>Recent Activity</caption>
            <caption id="date">{state.displayingDay}</caption>
            <thead>
              <tr key={"head_tr"}>
                <th style={{"width":"16rem"}}>Member Name</th>
                <th style={{"width":"4rem"}}>Flags</th>
                <th style={{"width":"12rem"}}>Visit Type</th>
                <th style={{"textAlign": "center"}} onClick={() => this.setState({toggle:!this.state.toggle})}>Edit Activity</th>
              </tr>
            </thead>
            <tbody id="recentActivityTbody">
            { this.state.displayingActivities == undefined || this.state.displayingActivities.Events.length == 0 ? (
              <tr key={"noEvents_tr"}>
                <td colSpan="3" id="noEvents">No events today.</td>
              </tr>
            ) : (
              this.state.displayingActivities.Events.map((actEvent,i) => ( 
                <tr id={actEvent._id} key={actEvent._id+"_tr"}>
                  <td onMouseEnter={(e) => hover([{actEvent}.actEvent.MemberID,e])} onMouseLeave={hoverOut}>{actEvent.Name}</td>
                  {actEvent.flags.includes("noID") ? (
                    <td>
                      <svg viewBox="0 0 512 512" style={{width:"1.75rem"}}>
                      {/*License: CC0. Original art by SVG Repo: https://www.svgrepo.com/svg/202851/ghost */}
                        <path style={{fill:"#CCCCCC"}} d="M420.607,164.6v303.522c0,20.451-23.636,31.857-39.647,19.119v-0.013
                          c-8.906-7.079-21.53-7.079-30.436,0l-24.435,19.449c-8.906,7.092-21.517,7.092-30.423,0l-24.435-19.449
                          c-8.906-7.079-21.53-7.079-30.436,0l-24.435,19.462c-8.906,7.079-21.517,7.079-30.423,0l-24.448-19.462
                          c-8.906-7.079-21.53-7.079-30.436,0l-0.013,0.013c-15.998,12.738-39.647,1.345-39.647-19.119V164.6
                          C91.393,73.686,165.092,0,256.006,0c45.445,0,86.601,18.421,116.39,48.21C402.185,77.987,420.607,119.143,420.607,164.6z"/>
                        <g>
                          <path style={{fill:"#666666"}} d="M195.084,114.487c17.838,0,32.301,14.45,32.301,32.288s-14.463,32.301-32.301,32.301
                            s-32.288-14.463-32.288-32.301S177.246,114.487,195.084,114.487z"/>
                          <path style={{fill:"#666666"}} d="M316.916,114.487c17.838,0,32.288,14.45,32.288,32.288s-14.45,32.301-32.288,32.301
                            c-17.838,0-32.288-14.463-32.288-32.301S299.078,114.487,316.916,114.487z"/>
                        </g>
                        <path style={{fill:"#CCCCCC"}} d="M283.918,2.36C274.846,0.812,265.522,0,256.006,0C165.092,0,91.393,73.686,91.393,164.6v303.522
                          c0,20.464,23.648,31.857,39.647,19.119l0.013-0.013c6.014-4.783,13.727-6.331,20.845-4.656c-2.918-3.933-4.681-8.855-4.681-14.45
                          V164.6C147.216,83.201,206.299,15.605,283.918,2.36z"/>
                      </svg>
                    </td>
                  ) : (
                    <td></td>
                  )}
                  <td>{actEvent.event}</td>
                  <td><AddInfoButton activity={actEvent} clickedCheckbox={(e) => this.checkboxClicked(e)} clickedAddInfo={() => openPopUp(actEvent, {displayDay: state.displayingDay, submitButtonText: "Add Info", "message":"Editing "+actEvent.Name+"'s event..."}, "(e) => handleSubmitPopUp(true,e)")} showCheckbox={this.state.toggle} index={i}/></td>
                </tr>))
            )}
            </tbody>
          </table>
          { this.state.firstCheckboxSelected && this.state.selected.length > 0 ? (
            <>
              <div style={{display:"flex", "justifyContent":"center"}}>
                <p style={{margin: ".5em"}}>{this.state.selected.length} Activities selected</p>
                <button type="button" style={{margin:".25em"}} onClick={(e) => batchEdit(e,this.state.selected)}>Edit</button>
                <button type="button" style={{margin:".25em"}} onClick={(e) => batchDelete(e,this.state.selected)}>Delete</button>
              </div>
            </>
          ):(
            <></>
          )}
        </>
      );
    }
  }

  return (
    <div className="container">
      <Head>
        <title>Makerspace Badging System</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main> 
        {/*<a className="cornerButton" id="stock" href="/stock">Config</a>*/}
        <button className="cornerButton" id="config" onClick={() => toggleConfigPopup()}>Config</button>
        <a className="cornerButton" id="stats" href="/stats">Stats</a>
      </main>

      {state.isOpen ? (
        <React.Fragment>
          <section className="Popup">
            <Popup 
              badgeInDate={new Date(state.activityEvent.badgeInTime).toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              badgeInTime={new Date(state.activityEvent.badgeInTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              badgeOutDate={new Date(state.activityEvent.badgeOutTime).toLocaleString("en-CA", localDateTimeOptions).substring(0,10)} //In local time
              badgeOutTime={new Date(state.activityEvent.badgeOutTime).toLocaleString("en-CA", localDateTimeOptions).substring(12,17)} //In local time
              message={state.displayProps.message}
              submitButtonText={state.displayProps.submitButtonText}
              existsInDB={false}
              noId={false}
              event={state.activityEvent.event}
            />
          </section>
        </React.Fragment>
      ) : (
        <div></div>
      )}

      {state.showConfigPopup ? 
        <ConfigPopup cancel={toggleConfigPopup}/>
        : <div></div>
      }

      <section className="fit">
        {members.filter(member => member.badgedIn == true).length == 0 ? (
          <p style={{"textAlign":"center"}}>No one badged in...</p>
        ) : (
          <>
            <table>
              <caption>Badged In Members</caption>
              <thead className="badgeInMembers">
                <tr>
                  <th key={"NameHeader"}>Name</th>
                  <th key={"MajorHeader"}>Major</th>
                  { certificationNames.map((cert) => 
                    <th key={cert+"_th"} className="rotated"><div><span>{cert}</span></div></th>
                    )}
                </tr>
              </thead>
              <tbody>
                {members.filter(member => member.badgedIn == true).map((member) => (
                  <tr key={member._id+"_tr"}>
                    <td onMouseEnter={(e) => hover([{member},e])} onMouseLeave={hoverOut}>{member.Name}</td>
                    <td>{member.Major}</td>
                    { certFullNameList.map((cert) => 
                      member[cert] ? (
                        <td key={member.id+"_"+cert+"_td"} className="true"></td>
                        ) : ( <td key={member.id+"_"+cert+"_td"} className="false"></td>)
                    )}
                    <td>
                      <button type="button" onClick={() => badgeOutManually(member)}>Badge Out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <SearchMemberBadgeIn members={members}></SearchMemberBadgeIn>
      </section>
      <section id="recentActivity" className="fit">
        <RecentActivity></RecentActivity>
      </section>

      <details style={{"marginTop": "5vh"}}>
        <summary>Developer Notes</summary>
        <h3>Bugs:</h3>
        <ul>
          <li>Batch Edit: Flags disappear when changing days</li>
          <li>/api/members PUT | Does not create an event! Just badges out.</li>
          <li>Fix: getMemberStats() (relies on member.sessions)</li>
          <li>Some times are it the wrong timezone. +5 1/1-3/14. +4 3/14-</li>
          <li>Point of User confusion: ?new popup still open. badgeOut popup should be a higher z-height</li>
          <li>validation: no negative session minutes</li>
          <li>Fix: lastBadgeIn. It should trigger after edits, if lastBadge (lessthan) badgeInTime then update.</li>
        </ul>
        <h3>Next up:</h3>
        <ul>
          <li>Finish: Edit Member Pop Up</li>
          <li>Convert javascript to React.Component: badgeIn.js PopUps</li>
          <li>New Feature: Add button to failed badgeIn popup. When clicked lets you search members, selected member get its RFID updated.</li>
          <li>Give all activities flags (edited, auto-generated, noID).</li>
          <li>New Feature: Auto-badge in</li>
          <li>Bash script executable: git pull updates, start the server, start PacsProbe</li>
          <li>Add button to badgeIn allowing members to make accounts w/o an ID. We should flag all no id members w/ the same RFID_UID. They can select from the list of all accounts to badgeIn if they made an account already.</li>
          <li>check if user badgeIn time is from a different day. Alert the user.</li>
          <li>Prevent members from accessing this page (the backend)</li>
          <li>Perfect VisitType nomenclature. Also add a question mark button that gives definitions of each visitType. Add Meeting w/ Joe</li>
          <li>Proper Coding Convention: Replace getMachinesUtilized(), getotherToolsUtilized() with props</li>
          <li>editing events w/ flags.contain(noID): Ability to change name</li>
        </ul>
        <h3>Before v1 Release:</h3>
        <ul>
          <li>ReadMe / Documentation</li>
          <li>Easy setup (config file)... List of majors, List of GraduationYears</li>
          <li>Bun!</li>
          <li>Look into railways.app / npm  / Vercel deployment</li>
          <li>Timezone variable</li>
        </ul>
        <p>Random dev note: Isomorphic-unfetch allows us to make HTTP requests inside out NextJS app</p>
      </details>
    </div>
  )
}

export async function getStaticProps(context) {
  const client = await clientPromise

  //Fetch "members" and "activities" Collection as server-side props
  const membersCollection = await client.db().collection("members");
  const membersArray = await membersCollection.find({}).toArray();
  const membersP = JSON.parse(JSON.stringify(membersArray));

  const activityCollection = await client.db().collection("activities");
  const activityArray = await activityCollection.find({}).toArray();
  const activityP = JSON.parse(JSON.stringify(activityArray));

  const configCollection = await client.db().collection("config");
  const configArray = await configCollection.find({}).toArray();
  const configP = JSON.parse(JSON.stringify(configArray));

  return { 
    props: { members: membersP, activities: activityP, config: configP } 
  }
}