import path from 'path';
import fs from 'fs/promises'
import crypto from 'crypto';
import {diffLines} from 'diff';
import chalk from 'chalk'; // ADD THIS IMPORT


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
        // write the file data to the new path(which is inside the objects folder)
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
        // head stores the commitHash , so parentCommit is the last commit hash stored in head
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

   // parent commit hash
   // the commit hash stored in head file
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


    // function to show the commit diff with its parent


    async showCommitDiff(commitHash){
        // we are having commitHash get the commit data from this hash
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if(!commitData){
            console.log(`Commit not found`);
            return;
        }

        console.log(`Changes in the last commit are :`);

        // a single commit can have many files
        for(const file of commitData.files){
            console.log(`Files is : ${file.path}`);

            // in the index array we pushed file path and file hash
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            /*
            New commit has this file and we printed the content of this file. 
            Now we will check if the parent commit is also having this file. 
            If yes then this means that the content of this file has got changed. 
            */


            // now let us see what was present inside this file in the parent commit 
            if(commitData.parent){
                // to get parentCommit data pass the parent hash = commitData.parent
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const parentFileContent = await this.getParentFileContent(parentCommitData , file.path);

                // now use the chalk and see the difference between fileContent and parentFileContent
                // to do this we will use the npm diff package 
                 if(parentFileContent !== undefined){
                    console.log('\nDiff : ');
                    const diff = diffLines(parentFileContent , fileContent);
                   // console.log(diff);

                    diff.forEach(part =>{
                        if(part.added){
                            process.stdout.write(chalk.green(part.value));
                        }else if(part.removed){
                            process.stdout.write(chalk.red(part.value));
                        }else{
                            process.stdout.write(chalk.grey(part.value));

                        }
                    });
                    console.log(); // new line

                 }
                 else {
                    console.log(`New file in this commit `);
                 }

                }
                else{
                    console.log(`First Commit`);
                }

            }
        }

    

    async getParentFileContent(parentCommitData , filePath){
        const parentFile = parentCommitData.files.find(file => file.path === filePath) 
        // if that file is present in the parentCommit 
        // which means same file is in parentCommit and the new Commit also
        // which indicates that the content of this file has got changed 
         if(parentFile){
            return await this.getFileContent(parentFile.hash);
         }
    }
   
  
    async getCommitData(fileHash){
        const commitPath = path.join(this.objectPath , fileHash);
        try {
            return await fs.readFile(commitPath , {encoding:'utf-8'});
        } catch (error) {
            console.log(`Failed to read the commit data`, error);
            return null;
        }
    }

    async getFileContent(fileHash){
        const filePath = path.join(this.objectPath,fileHash);
        return fs.readFile(filePath , {encoding:'utf8'});
    }

}


(async () =>{
    const verx = new Verx();
     await verx.init(); 
    //  await verx.add('sample.txt');
    //  await verx.add('sample2.txt');
    //  await verx.add('sample3.txt');
    //  await verx.commit(`Fifth commit`);
    //  await verx.log();

   await verx.showCommitDiff('1dbf9d02db829a577ef19ef146f28b5bf1b59733');
})() ;