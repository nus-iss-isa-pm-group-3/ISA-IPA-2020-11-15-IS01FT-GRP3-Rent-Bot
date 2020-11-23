### ISA-IPA-2020-11-15-IS01FT-GRP3-Rent-Bot
## SECTION 1 : PROJECT TITLE
## Rent Bot

---

## SECTION 2 : EXECUTIVE SUMMARY / PAPER ABSTRACT

---

## SECTION 3 : CREDITS / PROJECT CONTRIBUTION

| Official Full Name  | Student ID (MTech Applicable)  | Work Items (Who Did What) | Email (Optional) |
| :------------ |:---------------:| :-----| :-----|
| CAO Zi Hao | A0215407M | Dialogflow Conversation | e0535497@u.nus.edu |
| WANG Si Xiang | A0215475A | Finite State Machine Project report  | e0535565@u.nus.edu |
| ZHANG Jiu Yun | A0215513R | Clustering analysis Conversation platform developmentProject Report  | e0535603@u.nus.edu |
| ZUO Zong Yuan | A0215291L | Set up web server  PDF generation Testing  | e0535381@u.nus.edu |

---

## SECTION 4 : VIDEO OF SYSTEM MODELLING & USE CASE DEMO

---

## SECTION 5 : USER GUIDE
4.1 Installation and User Guide 

Please make sure you are using Node.js 12.0.0 or higher (see Node.js column in combatibility table). 

 

Download the source file and extract, or 

Clone the repository from git: 
 
git clone https://github.com/nus-iss-isa-pm-group-3/ISA-IPA-2020-11-15-IS01FT-GRP3-Virtual-Renting-Assistant.git 
 

cd to the SystemCode directory, run the following command in terminal: 

For production: 

 
npm install --production 
npm start 
 

For development: 

 
npm install --production=false 
npm run dev 
 

Configure Twilio 

Sign up for Twilio and activate the Sandbox 

Before you can send a WhatsApp message from your web language, you'll need to sign up for a Twilio account or sign into your existing account and activate the Twilio Sandbox for WhatsApp. It allows you to prototype with WhatsApp immediately using a shared phone number, without waiting for a dedicated number to be approved by WhatsApp. 

To get started, select a number from the available sandbox numbers to activate your sandbox. 

WA_Sandbox.png 

Be sure to take note of the phone number you choose in the Sandbox. You will need this later when we're ready to send some messages. 

Connect the Sandbox to the server 

When someone replies to one of your messages, you will receive a webhook request from Twilio. 

You can configure webhooks by connecting your Sandbox to an app you've already built for handling incoming messages, or build a new one for WhatsApp messages. 

 

Note: The webhook URL should either be your distributed service URL (production) or the URL shown in terminal in step 2 (development).
---

## SECTION 6 : PROJECT REPORT / PAPER
Nowadays the housing prices in Singapore has become increasingly expensive, which lead to the fact that more and more people have to rent house. In order to help tenants find a suitable residence, lots of real estate companies now will list the house information on various websites. However, the flood of the unstructured lease information can increase the time of finding useful information and waste the users’ time. Besides, a majority group of these tenants are foreign students who may have trouble accessing these websites, let alone extracting information. Moreover, the demand of online renting could witness a huge increase in these two years considering the limited physical interaction among people due to COVID-19.  

On the other hand, the cost of human labor for houses renting could be huge for the real estate companies. For each property listed on the websites, there would be one house manager whose responsibility is for further contact with the customers. In such a condition the number of property managers could be large thus contributing to a high cost. Meanwhile, popular renting websites such as propertyguru and stproperty do not have virtual assistant or agent, which implies a potential market for the virtual renting agent. 
---

