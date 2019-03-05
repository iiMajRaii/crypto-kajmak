# CryptoKajmak Blockchain Web Application  

Authors:  
  Dragoljuba Damjanovic  
  Majra Caluk  
  
Demo of the CryptoKajmak application:
https://www.dropbox.com/s/h03vau6wyi7ss56/CryptoKajmakVideo.mp4?dl=0

Project documentation of the CryptoKajmak application:
https://docs.google.com/document/d/1AheNoImLaMBTQ-_f1_iUjt6NdZG6fuMiNfEM5KjHRYU/edit?usp=sharing

Explanation of the folder structure:

- crypto-kajmak: main folder
- kajmak-network: folder that contains all files necessary for starting the blochain network
- chaincode: folder that contains chaincode of the application
- client: folder that cointains front-end of the application
- folder: folder that contains Fabric Node.js client implementation. File helper.js is the point where the application interacts with the blockchain network
- user: folder that contains user definition in the external database
- server.js: file that containes server logic
- registerAdmin.sh: script that registers admin user
- startServer.sh: script that starts the server on the port 8000
- startKajmak.sh: script that starts the blockchain network

Front-end communicates with the server, server communicates with the helper.js file, helper.js file communicates with the chaincode, chaincode communicates with the ledger.
  
# Steps 
## 1. Clone the repository
   ```
   git clone https://github.com/iiMajRaii/crypto-kajmak.git
   ```
## 2. Create external database:
   Go to [mLab](mlab.com/) and log in if you already have an account or sign up to create new one.
   After that, open up your database dashboard. 
   Create new database by clicking on "Create New".
   Select the free sandbox database and give it a name of your choice.
   When the database is created, click on it. Then click on "Users" -> "Add database user".
   Choose username and password.
   You are able to see connection string that looks similar to this one:
   ```
   mongodb://<dbuser>:<dbpassword>@ds243041.mlab.com:43041/cryptokajmakdb
   ```
   Copy and paste that connection string into the database.js file.
   Replace `<dbuser>` with the username and `<dbpassword>` with the password you chose in the previous step.
  
## 3. Run the application:  
  Navigate to crypto-kajmak folder using `cd` command:
  ```
  cd crypto-kajmak
  ```
  Start the blockchain network:
  ```
  ./startKajmak.sh
  ```
  If getting error permission denied, run command:
  ```
  chmod a+x startFabric.sh
  ```
  Start the web server:
  ```
  ./startServer.sh
  ```
  Open new terminal. Navigate again to the crypto-kajmak folder.
  From the new terminal we will register admin user:
  ```
  ./registerAdmin.sh
  ```
  Open the browser. Go to the page:
  ```
  localhost:8000
  ```
  Now you can start to use the application.
  
  Login with username: adminuser and password: adminuser to be able to add new users into the network.
