const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

let args = process.argv
let password = args[2]

let envLocalContent = "MONGODB_URI=mongodb+srv://admin:"+password+"@m0cluster.hqusv.mongodb.net/mainDB?retryWrites=true&w=majority"

async function installNext() {
    console.log("Attempting to npm install Next.js...")
    try {
        const { stdout, stderr } = await exec('npm install next --legacy-peer-deps');
        //console.log('stdout:', stdout);
        if (stderr){
            console.log('Error installing Next.js:', stderr)
        } else { 
            console.log("Successfully installed Next.js") 
            writeEnvLocal()
        }
    } catch (e) { console.error(e); }
}

async function writeEnvLocal(){
    console.log("Attempting to write .env.local...")
    fs.writeFile('.env.local', envLocalContent, err => {
        if (err) { 
            console.error(err); 
        } else { console.log("Successfully wrote .env.local") }
    });
}

installNext()

//TODO: Instantiate MongoDB Cluster w/ activities, members, config (is this neccessary?)
//TODO: Check if state.configCollection == undefined... if so display a welcome message and draw attention to the Config button