import path from 'path';
import fs from 'fs/promises'
import crypto, { hash } from 'crypto';
import { timeStamp } from 'console';

class Verx {

    constructor (repoPath = '.'){
        this.repoPath = path.join(repoPath , '.verx');
        this.objectPath = path.join(this.repoPath , 'objects') // .verx//objects
        this.headPath = path.join(this.repoPath , 'HEAD');
        // for staging area (things which are going to be in the next commit)
        this.indexPath = path.join(this.repoPath , 'index');

        // call the init method
       
    }

    async init() {
        // for the objects folder
        await fs.mkdir(this.objectPath , {recursive:true});

        // for the head and index file

        try{
            // for head file the file content is empty
            await fs.writeFile(this.headPath, '', { flag: 'wx' });

            // for the indexpath file the file content is empty array
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });

        } catch(err){
            console.log(`Already initialised the .groot folder`);
        }
    }

    // creating the hash object
    hashObject (content){
        return crypto.createHash('sha1').update(content , 'utf-8').digest('hex');
    }

    // creating the add file function
    async add(fileToBeAdded){
        // read the file data
        const fileData = await fs.readFile(fileToBeAdded , {encoding : 'utf-8'});
        // create the hash for it
        const fileHash = this.hashObject(fileData);
        console.log(fileHash);

        // Now add the fileHash in the .verx folder
        const newFileHashedObjectPath = path.join(this.objectPath , fileHash);
        // write the file data to the new path
        await fs.writeFile(newFileHashedObjectPath , fileData);

        // Add the file in the staging area
        await this.updateStagingArea(fileToBeAdded , fileHash);

        console.log(`Added ${fileToBeAdded}`);
    }


    // for the staging area
    async updateStagingArea(filePath , fileHash){
        // read the existing content of index file. 
        // The index file stores staged files in JSON format.
        // Parse the JSON into a JavaScript array so it can be modified.
        const index = JSON.parse(await fs.readFile(this.indexPath , {encoding:'utf-8'}));

        // inside the array push the filePath and fileHash
        index.push({path : filePath , hash : fileHash});

        // write this new array back to the index file
        await fs.writeFile(this.indexPath , JSON.stringify(index));
    }


    async commit(message) {
        // read the satging area data
        const index = JSON.parse(await fs.readFile(this.indexPath , {encoding: 'utf-8'}));
        // extract the last commit
        const parentCommit = await this.getCurrentHead();

        // a commit is having a lot of data , so we are going to make a object to store all of this 
        const commitData = {
            timeStamp : new Date().toISOString(),
            message,
            files : index,
            parent : parentCommit 
        }

        // commit is also a hash of all this data object 
        const commitHash = this.hashObject(JSON.stringify(commitData));
        // get the commitPath
        const commitPath = path.join(this.objectPath,commitHash);
        // commitPath = ".verx/objects/a1b2c3"

        // now write the file
        await fs.writeFile(commitPath , JSON.stringify(commitData));

        // since head is changed (it should point to the new commit)
        await fs.writeFile(this.headPath , commitHash);

        // now everything in th staging area has been pushed to the commit , so clear the  staging area. 
        await fs.writeFile(this.indexPath , JSON.stringify([]));

        console.log(`Commit Successfully created ${commitHash}`);
    }


    async getCurrentHead(){
        try {
            return await fs.readFile(this.headPath , {encoding:'utf-8'});
        } catch (error) {
            // if there is no head file , return null
            return null;
        }
    }


    // git log
    async log(){
        let currentCommitHash = await this.getCurrentHead();

        while(currentCommitHash){
            // 1. Build the full path to the commit object file
            const commitPath = path.join(this.objectPath, currentCommitHash);

           // 2. Read the commit file from disk (returns a string or buffer)
           const commitFileContent = await fs.readFile(commitPath, { encoding: 'utf-8' });

            // 3. Convert the JSON string into a JavaScript object
            const commitData = JSON.parse(commitFileContent);
            console.log(`------------------\n`);
            console.log(`Commit : ${currentCommitHash}\nDate:
                ${commitData.timeStamp}\n\n${commitData.message}`);

                // goto the parent
                currentCommitHash = commitData.parent;
        }
    }


}


(async () =>{
    const verx = new Verx();
     await verx.init(); 
    await verx.add('sample.txt');
    await verx.commit(`Third commit`);

    await verx.log();
})() ; 
