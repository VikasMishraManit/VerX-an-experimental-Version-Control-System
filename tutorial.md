## New Section : Setup

1) We are using js for this
```
npm init -y
```
2) Make a Verx.mjs file (mjs because we want to use import keyword )


## New Section : Constructor for saving .verx folder 

When we do git init , then git creates a .git folder. Similarly we want to do in our VCS.
In the current folder (denoted by repoPath) we will make a .verx folder
```
import path from 'path';

class Verx {

    constructor (repoPath = '.'){
        this.repoPath = path.join(repoPath , '.verx');
    }
}
```


## New Section : Creating the folders inside of .verx folder

Usually we can see that .git has many folders inside it like objects , head etc for storing hashes and all. 
We are going to do something similar for our VCS also
```
 constructor (repoPath = '.'){
        this.repoPath = path.join(repoPath , '.verx');
        this.objectPath = path.join(this.repoPath , 'objects') // .verx//objects
        this.headPath = path.join(this.repoPath , 'HEAD');
        // for staging area (things which are going to be in the next commit)
        this.indexPath = path.join(this.repoPath , 'index');
        this.init();
    }
```



## New Section : Adding the init method for our VCS

1) First call the init method in the constructor

2) Now for creating the folder/ file we will need the fs module in the project
```
import fs from 'fs/promises'
```

3) For writing the folder (objects) we are going to write it recursively (bcz it is present inside the .groot). 
And for writing the file we are going to use the try catch and a flag wx (write exclusive : if file not present already then dont write it.). 
```
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
```




## New Section : Let us try it out to check we can do it or not

1) Make this function and run the command
```
const verx = new Verx();
```

Output : A .verx folder will be created which will be having the objects folder , HEAD file and index file inside it. 



## New Section : Creating a hashObject for creating hash of a content 

1) First we will need an hashObject for creating hash of a content.  
Node.JS has a crypto module inside it , which has some inbuilt hash functions which we can use in the code. Git also use SHA-1 hash function , which we are also going to use inside our project. 

```
hashObject (content){
        return crypto.createHash('sha1').update(content , 'utf-8').digest('hex');
    }
```

"This line generates a deterministic SHA-1 hash by converting the given content into UTF-8 bytes and returning a hexadecimal string that uniquely identifies the content, which is commonly used as an object ID in version control systems."




## New Section : Completing the file to be added function 

1) first read the fileData
2) Create the hash for it   
3) Create a file those hash in the .verx folder and write the file content inside that hash. 
4) Add the file in the staging area.   ( we will do this later )

Our hash (SHA-1) is a 40 digit hex value . In git first 2 characters are used to create a folder and then
remaining are used for creating the file name inside that folder  

```
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
 ```   


 ## New Section : Check the function
 
 1) Create a sample.txt file
 2) verx.add('sample.txt'); (run the code)
 output :
 Already initialised the .groot folder
86744b27ab2c8976965fd56fa8241f22612b7349
Added sample.txt



## New Section : Staging area 

1) This function updates the staging area (like Git’s index) by recording which file is staged and which exact version of its content (via hash) should be included in the next commit.
```
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
```  


## New Section : Checking the staging area code 

1) delete the .verx folder
2) run the code again 

output of the index file 
[{"path":"sample.txt","hash":"86744b27ab2c8976965fd56fa8241f22612b7349"}]




## New Section : Generating the commit message

1) Write a function to get the last commit getCurrentHead
```
 async getCurrentHead(){
        try {
            return await fs.readFile(this.headPath , {encoding:'utf-8'});
        } catch (error) {
            // if there is no head file , return null
            return null;
        }
    }
```

2) Now the commit function
```
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

        // now write the file
        await fs.writeFile(commitPath , JSON.stringify(commitData));

        // since head is changed (it should point to the new commit)
        await fs.writeFile(this.headPath , commitHash);

        // now everything in th staging area has been pushed to the commit , so clear the  staging area. 
        await fs.writeFile(this.indexPath , JSON.stringify([]));

        console.log(`Commit Successfully created ${commitHash}`);
    }

```



## New Section : Try out the commit thing

1) Remove the this.init() from the constructor

```
<!-- The error happens because init() is async and is called inside the constructor without being awaited, so add() runs before .verx/index is created. await verx.add() does not wait for init() to finish. The fix is to remove init() from the constructor and explicitly await verx.init() before calling add() or commit(). -->

 constructor (repoPath = '.'){
        this.repoPath = path.join(repoPath , '.verx');
        this.objectPath = path.join(this.repoPath , 'objects') // .verx//objects
        this.headPath = path.join(this.repoPath , 'HEAD');
        // for staging area (things which are going to be in the next commit)
        this.indexPath = path.join(this.repoPath , 'index');

        // call the init method
       
    }
```

2) Now make the async function call 
```
(async () =>{
    const verx = new Verx();
     await verx.init(); 
    await verx.add('sample.txt');
    await verx.commit(`Initial commit`);
})() ; 
```

Output 
86744b27ab2c8976965fd56fa8241f22612b7349
Added sample.txt
Commit Successfully created c49fe2c0cc7c338f596eaacf64c513177d20c2fe



## New Section : Doing the git log 
 
1) Function for it
```
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
```

2) Add few lines in the sample.txt file

3) Call the function
```
(async () =>{
    const verx = new Verx();
     await verx.init(); 
    await verx.add('sample.txt');
    await verx.commit(`Third commit`);

    await verx.log();
})() ; 
```


## New Section : Adding the diff

1) Install chalk for coloring the output
```
npm install chalk
```

2) Make a function to get commit data from hash
```
 async getCommitData(commitHash){
        const commitPath = path.join(this.objectPath, commitHash);
       try {
          return await fs.readFile(commitPath, { encoding: 'utf-8' });
       } catch (error) {
        console.log(`Failed to read the commit data` , error);
        return null;
       }
    }
```

3) To read the content of the file
```
 async getFileContent(fileHash){
        const filePath = path.join(this.objectPath,fileHash);
        return fs.readFile(filePath , {encoding:'utf8'});
    }
```    

4) Now the diff function
```
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
```