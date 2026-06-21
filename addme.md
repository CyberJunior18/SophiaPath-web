🛡️ Web Security Foundations: The Beginner's Path

Welcome to the Web Security Foundations path! This course is designed to take you from a complete beginner to understanding the "Big Five" web vulnerabilities.

To become a hacker (or a defender), you first need to understand how things are built before you can understand how they break.

📘 Module 1: Cross-Site Scripting (XSS)

🧠 Prerequisites: The Web Frontend

Before understanding XSS, you need to know how web pages are displayed:

HTML (HyperText Markup Language): The skeleton of a web page. It uses tags like <h1> for headings or <script> for code.

JavaScript (JS): The muscle. It makes pages interactive. If a browser sees a <script> tag, it stops reading text and starts executing the code inside it.

The DOM (Document Object Model): How the browser reads the HTML and turns it into the page you see.

🐛 The Vulnerability: What is XSS?

XSS happens when an application takes untrusted data (like a search query or a comment) and sends it to a web browser without proper validation or escaping.

🧨 The Root Cause

Mixing Data with Code. The server assumes everything it sends to the browser is safe HTML. If a user types <script>alert('Boo!')</script> as their username, the server embeds it directly. The browser cannot tell the difference between the legitimate scripts written by the developer and the malicious script injected by the user.

🏋️ Mini-Exercise

Scenario: A website has a greeting feature: Welcome, [Name]!. The URL looks like this: site.com/greet?name=John.
Task: How would you modify the URL to force the website to execute a JavaScript alert box saying "XSS"?
Solution: Change the URL to site.com/greet?name=<script>alert('XSS')</script>.

📘 Module 2: SQL Injection (SQLi)

🧠 Prerequisites: Databases

What is a Database? A digital filing cabinet where a website stores users, passwords, and posts.

What is SQL? The language used to talk to the database.

Example: SELECT * FROM users WHERE username = 'admin' AND password = 'password123' means "Get me the user record where the username is 'admin' and the password matches."

🐛 The Vulnerability: What is SQLi?

SQLi allows an attacker to interfere with the queries that an application makes to its database. This can allow attackers to view data they shouldn't see, bypass logins, or even delete the database.

🧨 The Root Cause

String Concatenation. Developers often glue user input directly into the SQL command.
If the code is: query = "SELECT * FROM users WHERE username = '" + userInput + "'"
An attacker can input ' OR 1=1 --.
The resulting query becomes: SELECT * FROM users WHERE username = '' OR 1=1 --'
Because 1=1 is always true, and -- comments out the rest of the password check, the attacker is logged in as the first user in the database (usually the admin).

🏋️ Mini-Exercise

Scenario: You are facing a login screen. The backend query looks like: SELECT * FROM admin WHERE email = '[INPUT]' AND password = '[PASSWORD]'
Task: You don't know the password, but you know the admin's email is boss@site.com. What payload can you put in the email field to log in without a password?
Solution: Enter boss@site.com'--. The query becomes ...email = 'boss@site.com'--' AND password = '...'. The -- turns the password check into a harmless comment!

📘 Module 3: OS Command Injection

🧠 Prerequisites: The Command Line

The Terminal/CLI: The text-based interface used to control computers directly.

Basic Commands: ping (checks network connection), cat (reads files), ls (lists folder contents).

Chain Operators: In Linux, you can run multiple commands on one line using a semicolon (;), double ampersand (&&), or a pipe (|). Example: ping 8.8.8.8 ; ls will run the ping, and then run ls.

🐛 The Vulnerability: What is Command Injection?

This occurs when an application passes unsafe user-supplied data to a system shell. It allows the attacker to execute arbitrary operating system commands on the server that is running the application.

🧨 The Root Cause

Unsafe System Calls. Developers sometimes build tools (like a "Ping a Server" tool) by taking user input and pushing it straight to the server's backend operating system using functions like system() or exec().

🏋️ Mini-Exercise

Scenario: A website lets you look up the IP address of a domain. Behind the scenes, it runs: nslookup [USER_INPUT].
Task: You want to read the server's secret password file located at /etc/passwd. What do you type into the input box?
Solution: Enter google.com ; cat /etc/passwd. The server will run nslookup google.com and then immediately execute cat /etc/passwd.

📘 Module 4: Cross-Site Request Forgery (CSRF)

🧠 Prerequisites: HTTP & Cookies

Stateless Protocol: The internet (HTTP) has no memory. Every time you click a link, the server forgets who you are.

Cookies/Sessions: To keep you logged in, the server gives your browser a "Cookie" (a VIP pass).

The Golden Rule of Browsers: Whenever your browser sends a request to bank.com, it automatically attaches your bank.com cookies, no matter where that request originated from.

🐛 The Vulnerability: What is CSRF?

CSRF tricks a victim into submitting a malicious request. It inherits the identity and privileges of the victim to perform an undesired function on their behalf (like changing their password or transferring funds).

🧨 The Root Cause

Blind Trust in Cookies. The vulnerable website relies solely on the browser's automatic cookies to verify who is making the request. It doesn't ask "Did the user actually click the button on our website, or did a malicious website force their browser to send this request?"

🏋️ Mini-Exercise

Scenario: You are logged into twitter.com. An attacker sends you a link to funny-cats.com. On that page, there is a hidden image tag: <img src="http://twitter.com/delete_account" />.
Task: What happens when your browser tries to load that "image"?
Solution: Your browser sends a GET request to twitter.com/delete_account. Because you are logged in, your browser automatically attaches your Twitter cookie. Twitter sees a valid cookie, assumes you asked to delete your account, and deletes it.

📘 Module 5: Broken Access Control (IDOR)

🧠 Prerequisites: URLs and Parameters

URL Parameters: Data passed to the server via the web address, usually after a question mark. Example: site.com/profile?user_id=105.

Authentication vs. Authorization: * Authentication: Who are you? (Logging in).

Authorization: Are you allowed to do this? (Permissions).

🐛 The Vulnerability: What is IDOR?

Insecure Direct Object Reference (IDOR) happens when an application provides direct access to objects (like a database record or a file) based on user-supplied input without properly checking if the user is authorized to view it.

🧨 The Root Cause

Client-side Trust for Access Control. The server checks that you are logged in, but fails to verify that the resource you are requesting actually belongs to you. It blindly trusts the ID you provide in the URL or form.

🏋️ Mini-Exercise

Scenario: You log into your healthcare portal to view your test results. The URL is health.com/results?patient_id=4002.
Task: How could you easily test if this site is vulnerable to IDOR?
Solution: Change the URL to health.com/results?patient_id=4003 (or any other number). If you see another patient's medical records instead of an "Access Denied" error, you have found an IDOR vulnerability!

🎓 Final Certification Test

Test your knowledge by answering the following 5 questions without looking at the notes above!

1. A developer uses the following code to build a webpage: <div>Search results for: " + userInput + "</div>. What vulnerability is this most susceptible to?
A) SQL Injection
B) Cross-Site Scripting (XSS)
C) Command Injection
D) CSRF

2. Which character is most commonly used by attackers to "break out" of a database string and test for SQL Injection?
A) The semicolon ;
B) The ampersand &
C) The single quote '
D) The less-than sign <

3. Why do browsers automatically sending cookies make CSRF possible?
A) Because cookies are easily guessable.
B) Because the browser sends the session cookie even if the request is triggered by a malicious third-party site.
C) Because cookies contain passwords in plain text.
D) Because servers cannot read cookies sent from different domains.

4. You are testing a web app and notice that changing order_id=50 to order_id=51 in the URL allows you to see someone else's receipt. What vulnerability is this?
A) Command Injection
B) Reflected XSS
C) Broken Access Control (IDOR)
D) CSRF

5. What is the fundamental root cause of OS Command Injection?
A) Using Javascript instead of Python.
B) Storing passwords without encryption.
C) Taking user input and passing it directly into a system shell/terminal execution function.
D) Failing to use a firewall.

🗝️ Answer Key:

B (XSS - The input is reflected directly into the HTML without sanitization).

C (Single quote ' - Used to close strings early in SQL).

B (Browsers attach cookies based on the destination domain, regardless of where the request originated).

C (IDOR - Directly accessing an object you shouldn't have authorization for).

C (Unsafe OS system calls using raw user input).