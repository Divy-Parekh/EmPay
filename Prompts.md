

Problem Statement:- 



EmPay – Smart Human Resource Management System



The Challenge

EmPay – Simplifying HR \& Payroll Operations for Smarter Workplaces



Vision \& Mission

EmPay aims to modernize and simplify how organizations manage people,

processes, and payroll through a comprehensive, all-in-one Human Resource

Management System (HRMS). The platform is designed to provide a clean,

reliable, and user-friendly experience for both employees and

administrators—enabling seamless collaboration in managing attendance, leave,

payroll, and analytics from a unified interface. By focusing on robust, scalable, and

thoughtfully engineered solutions, EmPay strives to reduce manual dependency,

improve transparency, and empower organizations—especially startups,

institutions, and SMEs—to make informed, data-driven workforce decisions.





Problem Statement

Develop a working system, focusing on the following modules and flows:

User \& Role Management

User registration and login functionality.

Role-based access (Employee / HR Officer/ Admin / Payroll Officer).

Editable profile management.

Attendance \& Leave Management

Employees can mark attendance and view their daily/monthly logs.

Leave application, approval, and rejection workflows.

Payroll Management

Basic payroll module showing salary breakdown, deductions, and payout

summary.

Option for Admin/Payroll Officer to generate or edit monthly reports and

payslips.

Dashboard \& Analytics

Display of attendance, leaves, and payroll metrics through charts or

summaries.

Admin overview of employee data and overall HR statistics.





Roles and Responsibilties

1\. Admin

Register on the portal and manage user accounts.

Create, read, update, and delete data across all modules.

Manage user roles in settings.

Oversee all activities and ensure smooth system operations.

No access limitations.

2\. Employee

Apply for time off and see time off status.

View personal attendance and performance records.

Can access the employee directory and view individual records but

cannot modify them.

Cannot access settings, payroll, reports, salary info.

3\. HR Officer

Create and update employee profiles and details.

Monitor attendance records of all employees.

Manage \& Allocate new leaves to employees.

Cannot access payroll data or access system settings.

4\. Payroll Officer

Approve or reject time-off requests.

Generate payslip and leave reports.

Cannot create or modify employee data or access system settings, except

for managing salary-related information.

Manage Payroll, Time Off and Reports.

Can access attendance.





Terminologies

1\. Payroll

The process of calculating and distributing employee salaries, wages, bonuses,

and deductions. All payroll-related calculations are based on employee

attendance records for the given pay period.

2\. Payrun

A specific payroll cycle or period during which salaries are processed and

paid to employees. The payrun amount is calculated based on attendance,

approved leaves, and applicable deductions.

Roles \& Responsibilities

3\. Payslip

An official document provided to an employee for each payrun, showing a

detailed breakdown of earnings, deductions, and net pay. Payslips are

automatically generated once payroll is processed.

4\. Time-Off

A period during which an employee is officially permitted to be absent from

work (such as vacation, sick leave, or personal leave). Approved time-offs

are factored into payroll calculations.

5\. Wage

The monetary compensation paid to an employee for their work during a

specific period. Wages are calculated based on attendance, working

hours, and approved leaves.

6\. Provident Fund (PF) Contribution

A retirement benefit scheme in which both the employee and employer

contribute a fixed percentage (commonly 12%) of the employeeʼs basic

salary every month. PF is calculated based on the basic salary and serves

as long-term savings for the employee.

7\. Professional Tax

A small monthly tax levied by the state government on individuals earning income

through employment or profession. It is deducted directly from the gross salary as

part of monthly payroll processing.



Deliverables

Source code hosted on Git repository (with meaningful commits)

Why is this Hackathon Problem Important?

Students will learn real-world ERP workflows.

Understand how modules talk to each other for Eg (Employees →

Attendance → Payroll).

Practice problem-solving using business logic, not just coding.

















My Solution 



Lets build the solution now I will step by step tell you the solution and you will understand and analyze it for later solution building also I will be giving you the demo images to view the design of the modules listed



1. Login and Signup (reference : image/)

ONly the admin can signup with the details of company like company name, company logo, name , email, phone, password, confirm password and then sign up button when did this the new company is registered so there will be dataset of companies where the company details along with the creator information is stored and also the other table of the users where there will be the user of the company with details login id, email, password, company name. 



Instructions:-

&#x20;The Login ID should be automatically generated by the system in the following format:

\[OI (first two letters of the employee’s first and last name) (year of joining) (serial number of joining)]



Example: OIJODO20220001



Explanation:



OI → Odoo India (Company Name)

JODO → First two letters of the employee’s first name and last name

2022 → Year of Joining

0001 → Serial Number of Joining for that Year



Note:-

\- Normal user cannot register, so when the HR officer or Admin creates a new user/employee, there ID should also be created with this method.



\- There password should be auto generated for the first time by the system.



\-They can login and change the system generated password.

&#x20;



2\. Dashboard the admin sees after the login 


it will be a sidebar based dashboard with options employees (initial active tab), attendance, time off payroll(only visible to admin and hr payroll officer), reports(only visible to admin and hr payroll officer), settings, company details(only visible to admin) and also the sticky navbar that will show the status icon (is user checked in or not ) and on click option to toggle the status and the profile button that opens the dropdown to  my profile and the logout button 



instructions

* Make the employee cards clickable on the employees tab, and on click, the employee information page should open in a view-only (non-editable) mode.
* User Profile Picture (Avatar)
* Clicking the profile picture (avatar) should open a dropdown menu with options: My Profile, and Log Out.
* Upon successful Check IN, the red status dot changes to green.
* Employees can mark their attendance using the Check In/Check Out status, and users can view their attendance records through the Attendance module. 
* Each card should display the employee’s profile picture and some basic information.



At the top-right corner of each card, there should be an icon indicating the employee’s attendance or work status.



The status indicators are as follows:

🟢 Green dot: Employee is present in the office.

✈️ Airplane icon: Employee is on leave.

🟡 Yellow dot: Employee is absent. (Employee has not applied time off and is absent.)









3\. Clicking the New Employee button on the Employees tab
generate the modal to get the email, name and password of the employee and generated the credentials and email to the user the credentials and also the login id should be generated automatically as discussed earlier 



instructions 

* User should receive a mail of there Login id and password.
* Current user login id should be automatically populated for update button on the setting tab where we will be displaying all the users. 
* Make sure the employee receives the password through email or another digital method. 
* The password change mechanism should be different for administrators and regular users.



4\. employee detail page when the employee card is clicked



it should show the basic details of the employee on the top section (profile icon name,job position,email,phone,company,department,manager,location)and then below it should be the 4 tab layout resume, private info, salary info(only visible to admin or payroll officer) and security 



Resume section has 2 panels

right panel has 

About : 

What I love about my Job : 

My interests and hobbies



left panel has 

Skills :

certifications : 

(both with options to add new skills and certifications)



Private info has all the documents 

Date of Birth

address

nationality

gender

marital status

date of joining

bank details

acc num

bacnk name

ifsc code

pan no

uan no

emp code



if the bank details are not there then on the payroll tab it will show that this no of employee has not specified and same goes for the employee manager that this employees has not been assigned to the manager 





Salary info (visible to admin and payroll officer)

monthly wage ,yearly wage,no of working days and break time
and below it will be the salary componenets

basic,house rent,standard , performance, leave travel,fixed, etc allowances 

pf contribution : employee employe'r



tax: professsional tax



Note: 

The Salary Information tab allows users to define and manage all salary-related details for an employee, including wage type, working schedule, salary components, benefits. Salary components should be calculated automatically based on the defined Wage.



\- Wage Type



&#x20;  Fixed wage.



\- Salary Components



Section where users can define salary structure components.



Each component should include:

Basic, House Rent Allowance, Standard Allowance, Performance Bonus, Leave Travel Allowance, Fixed Allowance



Computation Type: Fixed Amount or Percentage of Wage



Value: Percentage field (e.g., 50% for Basic, 50% of Basic for HRA , Standard Allowance  4167 , Performance Bonus 8.33%, Leave Travel Allowance 8.333%, Fixed allowance is = wage - total of all the component )



Salary component values should auto-update when the wage amount changes.

The total of all components should not exceed the defined Wage





\- Automatic Calculation:



The system should calculate each component amount based on the employee’s defined Wage.



Example:



If Wage = ₹50,000 and Basic = 50% of wage, then Basic = ₹25,000.



If HRA = 50% of Basic, then HRA = ₹12,500.





Each fields for configuration (e.g., PF rate 12%).

and Professional Tax 200





Security has 

passowrd change operation



5\. Settings tab



it has the user settings all the users listed with Select user access rights as per their role and responsibilities. These access rights define what users are allowed to access and what they are restricted from accessing. Employee / Admin/ HR Officer / Payroll Officer



instructions 

\- In the Admin Settings, the administrator can assign user access rights based on each user’s role.

\- Access rights can be configured on an module basis, allowing specific permissions for each module.







6.Attendance tab



For the Admins

it has the details view of the employees daily check in and check out with the arrows to swtich the days see the daily activity of the employees regarding work hours and all

has arrows , date dropdown and day fields as the sub navbar 





For the Employees

shows the users activity of the check in and check out 

has the arrows, date selector, along with the count of days present , leaves remaining and totla working days



Notes:- 

* If the employee’s working source is based on the assigned attendace
* On the Attendance page, users should see a day-wise attendance of themselves by default for ongoing month, displaying details based on their working time, including breaks. 



* For Admins/Time off officers: They can see attendance of aff the employees

present on the current day.



* Attendance data serves as the basis for payslip generation.



* The system should use the generated attendance records to determine the total number of payable days for each employee.



* Any unpaid leave or missing attendance days should automatically reduce the number of payable days during payslip computation







7\. Time off tab



for the Admin and the HR Officer

will have the basic details of the timeoffs of the admin or hr officer then

all the requests of the employees' requests for the time off with approve or the reject options



for the employees 

all the current requests and a button that opens the modal to open the modal to create a new timeo ff with the employee (auto detected), timeo off type , validity period allocation (days) and attachements for sick leaves and submit or discard buttons 





Note:-



Employees can view only their own time off records, while Admins and HR Officers can view time off records \&

approve/reject them for all employees





8\. Payroll menu tab (only accessible to the admin)



it has 2 options in the sub navbar (dashboard and payrun)



Dashboard :(The Payroll Dashboard contains warnings, pay run information, and statistics related to employee and employer costs)

has warnings section like the employees with missings bank a/c or emp without the manager



has payrun section like number of payslips generated for the respected month



has the employer cost  analytics section with toggler to view it month wise and year wise 



has the employer count analytics section with toggler to view it month wise and year wise





Payrun :(The Payroll Payrun allows you to generate payslips for all employees at once. When you click the Payrun button, all employee payslips are created automatically.)



has the all the employees view with details pay peroid,employee,employer cost,basic wage,gross wage, net wage and status ('Done' status show once any pay run or payslip has been validated)whenn clicked on it or a user opens any generated payslip, they can view detailed information such as working days and worked day amounts. They can also generate a new payslip or cancel , and they can print the payslip as well.



a complete detailed view is opened for that slip with payrun details, salary structure, period and also tab view for the worked days and salary computation based on the earlier defined structure  and both have the given data 

Working days tab: attendance and the paid time off etc details

salary Compensation: the complete salary breakdown 



Note:- Salary is calculated based on the employee’s monthly attendance. Paid leaves are included in the total payable days, while unpaid leaves are deducted from the salary along with the deductions



INstructions:- 

The payslip of an individual employee is generated on the basis of 

attendance of that employee in a particular month.

Employer cost represents the employee’s monthly wage

Basic wage refers to the employee’s basic salary

Gross wage is the total of the basic salary + all allowances

Net wage is the total of gross -  deductions





9\. Reports tab (only visible to the admin or the payroll officer)

for the reports we have to select the employee name and the year and then we can generate the report for that employee in that year and also we can print that report also 



the solution will be build with the nodejs , reactjs, javascript , postgres db (from docker) and by writing the own queries not by any orm(like prisma or drizzle), nodemailer for emailing and tailwind css for styling with the variables set in the css file to change them any time 



this is the complete solution that i want to create 

Now I want you to create three files 
1. Overview.md that will have the system architecture of the plan 

2\. Backend.md that will have complete api structure and the schema of the project to build the entire system that uses the best practices 

2\. Frontend.md that will have the complete structure of the frontend and it follows the schema and apis generated from the backend.md file and also frontend design guidelines

























