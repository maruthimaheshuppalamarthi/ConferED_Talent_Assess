var Tu=Object.defineProperty;var Cu=(t,e,s)=>e in t?Tu(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var h=(t,e,s)=>Cu(t,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();const si={};var od;const ld=((od=si==null?void 0:si.VITE_API_URL)==null?void 0:od.replace(/\/$/,""))||"http://localhost:8000",da=`${ld}/api/v1`;class H extends Error{constructor(s,a){super(a);h(this,"status");this.status=s}}const Ti="confered.candidateToken";let Ie=null,Ls=(()=>{try{return sessionStorage.getItem(Ti)}catch{return null}})();function go(t){Ls=t;try{t?sessionStorage.setItem(Ti,t):sessionStorage.removeItem(Ti)}catch{}}let As="recruiter",ja=null,Xa=null;function Ci(t,e){var a;const s=t==null?void 0:t.detail;return typeof s=="string"?s:Array.isArray(s)&&((a=s[0])!=null&&a.msg)?String(s[0].msg):`Request failed (${e})`}async function cn(t,e,s,a,n=0){const i={};s!==void 0&&(i["Content-Type"]="application/json");const r=a==="staff"?Ie:a==="candidate"?Ls:null;r&&(i.Authorization=`Bearer ${r}`);const o=n>0?new AbortController:null,l=o?window.setTimeout(()=>o.abort(),n):0;try{return await fetch(`${da}${t}`,{method:e,headers:i,credentials:"include",body:s!==void 0?JSON.stringify(s):void 0,signal:o==null?void 0:o.signal})}catch(d){const c=d instanceof DOMException&&d.name==="AbortError";throw new H(0,c?"The server took too long to answer. Wait a moment and try again.":"Cannot reach the server. Make sure the backend is running.")}finally{l&&window.clearTimeout(l)}}async function dd(t,e,s,a,n=0){let i=await cn(t,e,s,a,n);return i.status===401&&a==="staff"&&Ie&&(await Li(As)?i=await cn(t,e,s,a,n):cd()),i}async function $t(t,e="GET",s,a="none",n=2e4){const i=await dd(t,e,s,a,n),r=await i.json().catch(()=>null);if(!i.ok)throw new H(i.status,Ci(r,i.status));return r}function cd(){Ie=null,Xa==null||Xa()}async function Li(t){return ja||(ja=(async()=>{try{const e=await cn(`/${t}/auth/refresh`,"POST",void 0,"none",8e3);if(!e.ok)return null;const s=await e.json();return Ie=s.accessToken,s}catch{return null}finally{setTimeout(()=>ja=null,0)}})()),ja}const T={apiBase:ld,setSessionExpiredHandler(t){Xa=t},getStaffToken:()=>Ie,getCandidateToken:()=>Ls,login:(t,e,s)=>$t(`/${t}/auth/login`,"POST",{email:e,password:s}),async verifyOtp(t,e,s){const a=await $t(`/${t}/auth/verify-otp`,"POST",{challengeId:e,otp:s});return Ie=a.accessToken,As=t,a},resendOtp:(t,e)=>$t(`/${t}/auth/resend-otp`,"POST",{challengeId:e}),async restoreSession(t){return As=t,Li(t)},setActivePortal(t){As=t},async changePassword(t,e,s){const a=await $t(`/${t}/auth/change-password`,"POST",{currentPassword:e,newPassword:s},"staff");return Ie=a.accessToken,a},async logout(){try{await cn(`/${As}/auth/logout`,"POST",void 0,"none")}catch{}finally{Ie=null}},createInvite:t=>$t("/recruiter/candidates/invites","POST",t,"staff"),inviteDelivery:t=>$t(`/recruiter/candidates/invites/${encodeURIComponent(t)}/delivery`,"GET",void 0,"staff"),async candidateVerify(t,e){const s=await $t("/candidate/verify","POST",{inviteToken:t,otp:e});return go(s.accessToken),s},candidateResendOtp:t=>$t("/candidate/resend-otp","POST",{inviteToken:t}),clearCandidateSession(){go(null)},postKeepalive(t,e,s="candidate"){const a=s==="staff"?Ie:s==="candidate"?Ls:null,n={"Content-Type":"application/json"};a&&(n.Authorization=`Bearer ${a}`);try{fetch(`${da}${t}`,{method:"POST",headers:n,credentials:"include",body:JSON.stringify(e),keepalive:!0})}catch{}},flushJson(t,e,s="candidate"){const a=s==="staff"?Ie:s==="candidate"?Ls:null,n={"Content-Type":"application/json"};a&&(n.Authorization=`Bearer ${a}`);try{fetch(`${da}${t}`,{method:"PUT",headers:n,credentials:"include",body:JSON.stringify(e),keepalive:!0})}catch{}},async downloadFile(t){const e=await dd(t,"GET",void 0,"staff");if(!e.ok){const n=await e.json().catch(()=>null);throw new H(e.status,Ci(n,e.status))}const s=e.headers.get("Content-Disposition")||"",a=/filename="?([^";]+)"?/i.exec(s);return{blob:await e.blob(),filename:a?a[1]:"download.csv",truncated:e.headers.get("X-Export-Truncated")==="true"}},fetchJson:(t,e="GET",s,a="staff")=>$t(t,e,s,a),async uploadForm(t,e,s="staff"){const a={},n=s==="staff"?Ie:s==="candidate"?Ls:null;n&&(a.Authorization=`Bearer ${n}`);let i=await fetch(`${da}${t}`,{method:"POST",headers:a,credentials:"include",body:e});if(i.status===401&&s==="staff"&&Ie)if(await Li(As)){const o={};Ie&&(o.Authorization=`Bearer ${Ie}`),i=await fetch(`${da}${t}`,{method:"POST",headers:o,credentials:"include",body:e})}else cd();if(!i.ok){const r=await i.json().catch(()=>null);throw new H(i.status,Ci(r,i.status))}if(i.status!==204)return i.json()}};class Lu{static executeCode(e,s,a){return T.fetchJson("/candidate/run","POST",{questionId:a,language:e,code:s},"candidate")}}const _u="modulepreload",Iu=function(t){return"/"+t},xo={},_i=function(e,s,a){let n=Promise.resolve();if(s&&s.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),o=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));n=Promise.allSettled(s.map(l=>{if(l=Iu(l),l in xo)return;xo[l]=!0;const d=l.endsWith(".css"),c=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${c}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":_u,d||(u.as="script"),u.crossOrigin="",u.href=l,o&&u.setAttribute("nonce",o),document.head.appendChild(u),d)return new Promise((f,p)=>{u.addEventListener("load",f),u.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(r){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=r,window.dispatchEvent(o),!o.defaultPrevented)throw r}return n.then(r=>{for(const o of r||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})},Mu={maxTabSwitches:3,maxViolationsBeforeTerminate:5,proctoringSensitivity:"high",requireCamera:!0,requireMicrophone:!0,requireScreenShare:!1,detectPhone:!0,detectMultipleFaces:!0,detectFaceMissing:!0,enableFullscreenLock:!0,otpMethod:"both",linkExpirationHours:48,allowSectionRevisit:!1},ca=[{id:"q-mcq-1",type:"mcq",title:"Python Memory Management",content:"Which module in Python can be used to inspect memory allocation and reference counts?",options:[{id:"opt-1",text:"sys"},{id:"opt-2",text:"gc"},{id:"opt-3",text:"tracemalloc"},{id:"opt-4",text:"All of the above"}],correctAnswers:["opt-4"],difficulty:"medium",points:10,category:"Python",tags:["Core Python","Memory","Performance"]},{id:"q-sql-1",type:"sql",title:"Employee Department Salary Ranking",content:"Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.",difficulty:"hard",points:20,category:"SQL Database",tags:["PostgreSQL","Window Functions","Analytics"],sampleCode:{sql:`-- Write your SQL query below
SELECT department_id, employee_id, salary
FROM (
  SELECT department_id, employee_id, salary,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank
  FROM employees
) sub
WHERE rank <= 2;`}},{id:"q-coding-1",type:"coding",title:"Two Sum Variant: Maximum Subarray Product",content:"Given an integer array `nums`, find a contiguous non-empty subarray within the array that has the largest product, and return *the product*.\n\n### Example 1:\n**Input:** `nums = [2,3,-2,4]`  \n**Output:** `6`  \n**Explanation:** `[2,3]` has the largest product 6.",difficulty:"medium",points:25,category:"Algorithms",tags:["Dynamic Programming","Array","Algorithms"],language:"python",sampleCode:{python:`def max_product(nums: list[int]) -> int:
    # Write your solution here
    if not nums:
        return 0
    
    res = max_num = min_num = nums[0]
    for i in range(1, len(nums)):
        n = nums[i]
        if n < 0:
            max_num, min_num = min_num, max_num
        max_num = max(n, max_num * n)
        min_num = min(n, min_num * n)
        res = max(res, max_num)
        
    return res

# Test call
print(max_product([2,3,-2,4]))`,javascript:`function maxProduct(nums) {
    if (!nums || nums.length === 0) return 0;
    let res = nums[0], maxNum = nums[0], minNum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        let n = nums[i];
        if (n < 0) {
            let temp = maxNum;
            maxNum = minNum;
            minNum = temp;
        }
        maxNum = Math.max(n, maxNum * n);
        minNum = Math.min(n, minNum * n);
        res = Math.max(res, maxNum);
    }
    return res;
}
console.log(maxProduct([2,3,-2,4]));`},testCases:[{id:"tc-1",input:"[2,3,-2,4]",expectedOutput:"6",isHidden:!1,weight:5},{id:"tc-2",input:"[-2,0,-1]",expectedOutput:"0",isHidden:!1,weight:5},{id:"tc-3",input:"[-2,3,-4]",expectedOutput:"24",isHidden:!0,weight:10},{id:"tc-4",input:"[0, 2]",expectedOutput:"2",isHidden:!0,weight:5}]},{id:"q-essay-1",type:"essay",title:"Microservice Architecture vs Monolith Design",content:"Discuss the architectural trade-offs between a modular monolithic system and an event-driven microservices architecture. Highlight aspects of deployment complexity, data consistency (CAP theorem / Saga pattern), and operational costs.",essayMinWords:150,essayMaxWords:500,difficulty:"hard",points:20,category:"System Design",tags:["Architecture","Microservices","Distributed Systems"]}],ai=[{id:"assess-101",title:"Senior Full Stack & AI Engineer Assessment",roleTitle:"Senior Software Engineer",description:"Comprehensive technical evaluation covering Quantitative Logic, Python/JS Algorithmic Coding, SQL Querying, and System Design Architecture.",totalDurationMinutes:60,totalQuestions:4,passingPercentage:70,status:"active",createdDate:"2026-07-20",sections:[{id:"sec-1",name:"Technical MCQs & Aptitude",description:"Core concepts in Python memory, async logic, and data structures.",instructions:"Select the best answer for each question. Negative marking is disabled for this section.",timeLimitMinutes:10,passingMarks:10,questions:[ca[0]],isMandatory:!0},{id:"sec-2",name:"Database & SQL Engineering",description:"Complex aggregation, window functions, and schema optimization.",instructions:"Write production-ready SQL queries. Test against the provided table schemas.",timeLimitMinutes:15,passingMarks:15,questions:[ca[1]],isMandatory:!0},{id:"sec-3",name:"Algorithmic Coding Challenge",description:"Data Structures and Dynamic Programming problem solving.",instructions:"Write efficient code. Pay attention to time complexity and edge cases.",timeLimitMinutes:20,passingMarks:20,questions:[ca[2]],isMandatory:!0},{id:"sec-4",name:"Architectural Essay",description:"System design principles, microservices, and high-availability systems.",instructions:"Ensure minimum word count requirement of 150 words.",timeLimitMinutes:15,passingMarks:15,questions:[ca[3]],isMandatory:!1}]}],qa="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/><path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>",Da="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/><circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>",Pu=[{id:"cand-1",name:"Alex Rivera",email:"alex.rivera@example.com",phone:"+1-555-0192",experienceYears:6,skills:["Python","FastAPI","TypeScript","PostgreSQL","Docker"],status:"Completed",assessmentId:"assess-101",invitedAt:"2026-07-28",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:qa,idProofUrl:Da,identityStatus:"approved"},{id:"cand-2",name:"Priya Sharma",email:"priya.sharma@example.com",phone:"+91-98765-43210",experienceYears:8,skills:["Java","Spring Boot","Microservices","SQL","Kubernetes"],status:"Under Review",assessmentId:"assess-101",invitedAt:"2026-07-29",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:qa,idProofUrl:Da,identityStatus:"approved"},{id:"cand-3",name:"Marcus Vance",email:"marcus.vance@example.com",phone:"+44-7700-900077",experienceYears:4,skills:["React","Node.js","GraphQL","Tailwind","MongoDB"],status:"Assessment Sent",assessmentId:"assess-101",invitedAt:"2026-07-30",otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1,livePhotoUrl:qa,idProofUrl:Da,identityStatus:"pending_verification"},{id:"cand-4",name:"Sophia Chen",email:"sophia.chen@example.com",phone:"+1-555-0144",experienceYears:5,skills:["Python","PyTorch","FastAPI","Docker","AWS"],status:"Selected",assessmentId:"assess-101",invitedAt:"2026-07-25",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:qa,idProofUrl:Da,identityStatus:"approved"}],ju=[{candidateId:"cand-3",name:"Marcus Vance",role:"Frontend Engineer",sectionName:"Algorithmic Coding Challenge",timeRemaining:"18:42",violations:0,status:"normal",lastEvent:""},{candidateId:"cand-2",name:"Priya Sharma",role:"Backend Engineer",sectionName:"Database & SQL Engineering",timeRemaining:"09:15",violations:2,status:"warning",lastEvent:"Tab Switch detected"},{candidateId:"cand-1",name:"Alex Rivera",role:"Platform Engineer",sectionName:"Technical MCQs & Aptitude",timeRemaining:"24:03",violations:0,status:"normal",lastEvent:""}],qu={"cand-1":{id:"res-1",candidateId:"cand-1",assessmentId:"assess-101",completedAt:"2026-07-28T16:45:00Z",totalScore:68,maxScore:75,percentage:90.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:20,maxScore:20,percentage:100},"Algorithmic Coding Challenge":{score:25,maxScore:25,percentage:100},"Architectural Essay":{score:13,maxScore:20,percentage:65}},aiConfidenceScore:94.5,totalViolations:1,proctoringLogs:[{id:"viol-1",candidateId:"cand-1",timestamp:"16:12:04",type:"Tab Switch",severity:"low",description:"Candidate switched window for 2 seconds (Warning issued)"}],recruiterNotes:"Exceptional coding speed and SQL window function expertise. Essay demonstrates solid understanding of Saga pattern trade-offs.",recruiterDecision:"Selected"},"cand-2":{id:"res-2",candidateId:"cand-2",assessmentId:"assess-101",completedAt:"2026-07-29T11:20:00Z",totalScore:54,maxScore:75,percentage:72,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:15,maxScore:20,percentage:75},"Algorithmic Coding Challenge":{score:15,maxScore:25,percentage:60},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:88,totalViolations:2,proctoringLogs:[{id:"viol-2",candidateId:"cand-2",timestamp:"11:05:12",type:"Looking Away",severity:"low",description:"Gaze moved off-screen for 4 seconds."},{id:"viol-3",candidateId:"cand-2",timestamp:"11:15:40",type:"Background Voice",severity:"medium",description:"Background audio detected above threshold."}],recruiterNotes:"Passed baseline cutoff. Requires technical interview follow-up on algorithmic edge cases.",recruiterDecision:"Under Review"}},ud="confered.examSnapshot";function Du(t){try{sessionStorage.setItem(ud,JSON.stringify(t))}catch{}}function Ru(){try{const t=sessionStorage.getItem(ud);if(!t)return null;const e=JSON.parse(t);return!e||typeof e!="object"||!e.inviteToken?null:e}catch{return null}}function Ou(t){const e=(t.options||[]).map(o=>({id:o.id,text:o.text})),s=(t.testCases||[]).map(o=>o.isHidden?{id:o.id,input:"",inputs:[],expectedOutput:"",isHidden:!0,weight:o.weight}:{...o}),{correctAnswers:a,rubric:n,explanation:i,...r}=t;return{...r,options:e,testCases:s,correctAnswers:void 0}}function vo(t){return t!=null&&t.sections?{...t,sections:t.sections.map(e=>({...e,questions:(e.questions||[]).map(Ou)}))}:t}class Fu{constructor(){h(this,"state");h(this,"listeners",[]);h(this,"activeStreams",[]);h(this,"positionRestored",!1);h(this,"progressTimer",null);h(this,"policyLoading",!1);h(this,"lastCountedViolationAt",{});h(this,"terminateArmed",!1);const e=new URLSearchParams(window.location.search),s=e.get("assessment");this.state={isStaffAuthenticated:!1,currentUser:null,allowedPortals:[],authReady:!1,candidateInviteToken:e.get("invite"),liveCandidates:ju.map(a=>({...a})),settings:{...Mu},assessments:[...ai],activeAssessmentId:s&&ai.some(a=>a.id===s)?s:ai[0].id,candidates:[...Pu],candidateResults:{...qu},questionBank:[...ca],activeCandidateId:"cand-3",otpVerified:!1,systemCheckCompleted:!1,examStarted:!1,examCompleted:!1,assessmentReady:!1,currentSectionIndex:0,currentQuestionIndex:0,sectionTimeRemainingSeconds:600,sectionEndsAtMs:null,candidateAnswers:{},codeSubmissions:{},codeDrafts:{},flaggedQuestions:new Set,candidateFeedback:null,isFullscreen:!1,violationCount:0,proctoringLogs:[],liveProctoringAlert:null,proctorIntercomMessage:null,theme:"dark"},T.setSessionExpiredHandler(()=>this.clearStaffSession())}toggleTheme(){this.state.theme=this.state.theme==="dark"?"light":"dark",this.state.theme==="light"?document.documentElement.classList.add("light-mode"):document.documentElement.classList.remove("light-mode"),this.notify()}getState(){return this.state}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(s=>s!==e)}}notify(){this.listeners.forEach(e=>e())}refresh(){this.notify()}registerMediaStream(e){e&&!this.activeStreams.includes(e)&&this.activeStreams.push(e)}getLiveCameraStream(){return this.activeStreams.find(e=>e.getVideoTracks().some(s=>s.readyState==="live"))||null}stopAllMediaStreams(){this.activeStreams.forEach(e=>{e&&e.getTracks&&e.getTracks().forEach(s=>{try{s.stop()}catch{}})}),this.activeStreams=[]}loginStaff(e){this.state.currentUser=e,this.state.allowedPortals=e.portals,this.state.isStaffAuthenticated=!0,this.notify(),e.mustChangePassword||this.loadPolicy("staff")}async loadPolicy(e){if(!this.policyLoading){this.policyLoading=!0;try{const[s,a]=await Promise.all([T.fetchJson("/policy/proctoring","GET",void 0,e),T.fetchJson("/policy/assessment","GET",void 0,e)]);this.state.settings={...this.state.settings,...s,...a},this.notify()}catch{}finally{this.policyLoading=!1}}}markAuthReady(){this.setAuthReady(!0)}setAuthReady(e){this.state.authReady!==e&&(this.state.authReady=e,this.notify())}clearStaffSession(){this.state.isStaffAuthenticated=!1,this.state.currentUser=null,this.state.allowedPortals=[],this.notify()}async logoutStaff(){try{await T.logout()}finally{this.clearStaffSession()}}candidateVerified(e){this.state.activeCandidateId=e.candidate.id,this.state.activeAssessmentId=e.candidate.assessmentId,this.state.assessmentReady=!1,this.state.otpVerified=!0,this.notify(),this.loadPolicy("candidate"),this.loadCandidateAssessment(e.candidate.assessmentId)}async loadCandidateAssessment(e){try{const s=await T.fetchJson("/candidate/assessment","GET",void 0,"candidate"),a=vo(s),n=this.state.assessments.findIndex(i=>i.id===a.id||i.id===e);n>=0?this.state.assessments[n]=a:this.state.assessments.unshift(a),this.state.activeAssessmentId=a.id,this.state.assessmentReady=!0,this.applyServerProgress(s),this.state.examStarted&&this.state.sectionEndsAtMs==null&&this.jumpToFirstQuestion(!0),this.notify()}catch{this.state.assessmentReady=!1,this.notify()}}hydrateExam(e){this.state.activeCandidateId=e.candidateId,e.assessmentId&&(this.state.activeAssessmentId=e.assessmentId),this.state.otpVerified=e.otpVerified,this.state.systemCheckCompleted=e.systemCheckCompleted,this.state.examStarted=e.examStarted,this.state.examCompleted=e.examCompleted,this.state.currentSectionIndex=e.currentSectionIndex||0,this.state.currentQuestionIndex=e.currentQuestionIndex||0,this.state.sectionEndsAtMs=e.sectionEndsAtMs,this.state.sectionTimeRemainingSeconds=this.getSectionRemainingSeconds(),this.state.candidateAnswers={...e.answers||{}},this.state.codeDrafts=e.codeDrafts||{},this.state.flaggedQuestions=new Set(e.flagged||[]),this.positionRestored=!0,e.examStarted&&!e.examCompleted&&(T.fetchJson("/candidate/exam/start","POST",{},"candidate").catch(()=>null),this.loadCandidateAssessment(this.state.activeAssessmentId))}seedCodeDrafts(e){this.state.codeDrafts=e||{}}applyServerProgress(e){const s=e.progress;if(e.examStartedAt&&!this.state.examCompleted&&(this.state.examStarted=!0,this.state.systemCheckCompleted=!0),!s)return;if(!Object.values(this.state.codeDrafts).some(n=>Object.values(n.files||{}).some(i=>i.length>0))&&s.codeDrafts&&(this.state.codeDrafts=s.codeDrafts),!Object.keys(this.state.candidateAnswers).length&&s.answers&&(this.state.candidateAnswers={...s.answers}),this.state.sectionEndsAtMs==null&&s.sectionEndsAt){const n=Date.parse(s.sectionEndsAt);Number.isNaN(n)||(this.state.sectionEndsAtMs=n)}this.positionRestored||(typeof s.sectionIndex=="number"&&(this.state.currentSectionIndex=s.sectionIndex),typeof s.questionIndex=="number"&&(this.state.currentQuestionIndex=s.questionIndex),s.flagged&&(this.state.flaggedQuestions=new Set(s.flagged)),this.positionRestored=!0)}progressBody(){return{sectionIndex:this.state.currentSectionIndex,questionIndex:this.state.currentQuestionIndex,sectionEndsAt:this.state.sectionEndsAtMs?new Date(this.state.sectionEndsAtMs).toISOString():null,answers:this.state.candidateAnswers,codeDrafts:this.state.codeDrafts,flagged:Array.from(this.state.flaggedQuestions)}}persistExam(e=!1){const s=this.state.candidateInviteToken;!s||!this.state.otpVerified||(Du({inviteToken:s,savedAt:Date.now(),candidateId:this.state.activeCandidateId,assessmentId:this.state.activeAssessmentId,otpVerified:this.state.otpVerified,systemCheckCompleted:this.state.systemCheckCompleted,examStarted:this.state.examStarted,examCompleted:this.state.examCompleted,currentSectionIndex:this.state.currentSectionIndex,currentQuestionIndex:this.state.currentQuestionIndex,sectionEndsAtMs:this.state.sectionEndsAtMs,answers:this.state.candidateAnswers,codeDrafts:this.state.codeDrafts,flagged:Array.from(this.state.flaggedQuestions)}),!(!this.state.examStarted||this.state.examCompleted)&&(this.progressTimer&&window.clearTimeout(this.progressTimer),this.progressTimer=window.setTimeout(()=>{this.progressTimer=null,T.fetchJson("/candidate/progress","PUT",this.progressBody(),"candidate").catch(()=>null)},e?0:700)))}flushExamProgress(){!this.state.otpVerified||!this.state.examStarted||this.state.examCompleted||(this.persistExam(),T.flushJson("/candidate/progress",this.progressBody(),"candidate"))}updateSettings(e){this.state.settings={...this.state.settings,...e},this.notify()}completeSystemCheck(){this.state.systemCheckCompleted=!0,this.notify()}startExam(){if(this.state.examStarted&&this.state.sectionEndsAtMs&&this.state.sectionEndsAtMs>Date.now()){this.positionRestored=!0,this.persistExam(!0),this.notify();return}this.state.examStarted=!0,this.state.examCompleted=!1,this.state.sectionEndsAtMs=null,this.terminateArmed=!1,this.lastCountedViolationAt={},this.jumpToFirstQuestion(!0),this.positionRestored=!0,this.notify(),T.fetchJson("/candidate/exam/start","POST",{},"candidate").catch(()=>null),this.persistExam(!0),this.state.activeCandidateId&&this.loadCandidateAssessment(this.state.activeAssessmentId)}getSectionRemainingSeconds(){return this.state.sectionEndsAtMs?Math.max(0,Math.ceil((this.state.sectionEndsAtMs-Date.now())/1e3)):Math.max(0,this.state.sectionTimeRemainingSeconds||0)}armSectionClock(e,s){const a=Math.max(1,Math.round((e||15)*60));if(!s&&this.state.sectionEndsAtMs&&this.state.sectionEndsAtMs>Date.now()){this.state.sectionTimeRemainingSeconds=this.getSectionRemainingSeconds();return}this.state.sectionEndsAtMs=Date.now()+a*1e3,this.state.sectionTimeRemainingSeconds=a,this.persistExam()}jumpToFirstQuestion(e=!1){const s=this.getActiveAssessment(),a=(s==null?void 0:s.sections)||[],n=a.findIndex(l=>(l.questions||[]).length>0),i=n>=0?n:0,r=i!==this.state.currentSectionIndex;this.state.currentSectionIndex=i,this.state.currentQuestionIndex=0;const o=a[this.state.currentSectionIndex];o&&this.armSectionClock(o.timeLimitMinutes||15,e||r)}getActiveAssessment(){const e=this.state.assessments.find(s=>s.id===this.state.activeAssessmentId);return e&&this.state.otpVerified&&!this.state.isStaffAuthenticated?vo(e):e}setAnswer(e,s,a=!0){this.state.candidateAnswers[e]=s,this.persistExam(),a&&this.notify()}noteCodeDraft(e,s,a){const n=this.state.codeDrafts[e]||{language:s,files:{}};n.language=s,n.files={...n.files,[s]:a},this.state.codeDrafts[e]=n,this.state.codeSubmissions[e]={...this.state.codeSubmissions[e]||{},code:a,language:s},this.state.candidateAnswers[e]={code:a,language:s},this.persistExam()}recallCode(e,s){var n,i;const a=(i=(n=this.state.codeDrafts[e])==null?void 0:n.files)==null?void 0:i[s];return typeof a=="string"?a:null}recallLanguage(e){var s;return((s=this.state.codeDrafts[e])==null?void 0:s.language)||null}setCodeSubmission(e,s){this.noteCodeDraft(e,s.language,s.code),this.state.codeSubmissions[e]={...this.state.codeSubmissions[e],...s}}toggleFlagQuestion(e){this.state.flaggedQuestions.has(e)?this.state.flaggedQuestions.delete(e):this.state.flaggedQuestions.add(e),this.persistExam(),this.notify()}nextQuestion(){var s;const e=(s=this.getActiveAssessment())==null?void 0:s.sections[this.state.currentSectionIndex];e&&this.state.currentQuestionIndex<e.questions.length-1&&(this.state.currentQuestionIndex++,this.persistExam(),this.notify())}prevQuestion(){this.state.currentQuestionIndex>0&&(this.state.currentQuestionIndex--,this.persistExam(),this.notify())}nextSection(){const e=this.getActiveAssessment(),s=(e==null?void 0:e.sections)||[];let a=this.state.currentSectionIndex+1;for(;a<s.length&&!(s[a].questions||[]).length;)a++;a<s.length?(this.state.currentSectionIndex=a,this.state.currentQuestionIndex=0,this.armSectionClock(s[a].timeLimitMinutes||15,!0),this.notify()):this.submitAssessment()}submitAssessment(){this.state.examStarted=!1,this.state.examCompleted=!0,this.state.sectionEndsAtMs=null,this.stopAllMediaStreams(),document.fullscreenElement&&document.exitFullscreen().catch(()=>{});const e=this.state.activeCandidateId||"cand-3",s=this.state.candidates.find(n=>n.id===e);s&&(s.status="Completed",s.assessmentCompleted=!0);const a={...this.state.candidateAnswers};Object.entries(this.state.codeDrafts).forEach(([n,i])=>{const r=i.language;a[n]={code:i.files[r]??"",language:r,files:i.files}}),T.fetchJson("/candidate/submit","POST",{answers:a},"candidate").catch(()=>null),this.notify()}async saveCandidateFeedback(e,s){await T.fetchJson("/candidate/feedback","POST",{rating:e,comment:s},"candidate"),this.markFeedbackSaved(e,s)}finishAndClose(e,s){T.postKeepalive("/candidate/feedback",{rating:e,comment:s},"candidate"),this.markFeedbackSaved(e,s)}markFeedbackSaved(e,s){this.state.candidateFeedback={rating:e,feedbackText:s,tags:[],submittedAt:new Date().toISOString()},_i(async()=>{const{candidateAssist:a}=await Promise.resolve().then(()=>qo);return{candidateAssist:a}},void 0).then(({candidateAssist:a})=>a.reportFinished()),document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),this.notify()}logProctoringViolation(e,s,a="medium",n){if(!this.state.examStarted||this.state.examCompleted)return;const i=e==="No Face Detected"||e==="Multiple Faces"||e==="Object Detected"||e==="Mobile Phone Detected"||e==="Looking Away",r=Date.now();if(i&&r-(this.lastCountedViolationAt[e]||0)<8e3)return;this.lastCountedViolationAt[e]=r,this.state.violationCount++;const o={id:`viol-${Date.now()}`,candidateId:this.state.activeCandidateId||"cand-3",timestamp:new Date().toLocaleTimeString(),type:e,severity:a,snapshotUrl:n==null?void 0:n.snapshotUrl,description:s};this.state.proctoringLogs.unshift(o),this.state.liveProctoringAlert=`${e}: ${s}`,_i(()=>Promise.resolve().then(()=>qo),void 0).then(d=>d.candidateAssist.reportViolation(e,a)).catch(()=>{});const l=this.state.liveCandidates.find(d=>d.candidateId===this.state.activeCandidateId);l&&(l.violations=this.state.violationCount,l.status=this.state.violationCount>=this.state.settings.maxTabSwitches?"warning":"normal",l.lastEvent=`${e} detected`),this.state.violationCount>=this.state.settings.maxViolationsBeforeTerminate&&!this.terminateArmed&&(this.terminateArmed=!0,this.state.liveProctoringAlert=`EXAM TERMINATED: Warning limit reached (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`,window.setTimeout(()=>{this.state.examCompleted||this.submitAssessment()},1200)),this.notify()}clearProctoringAlert(){this.state.liveProctoringAlert!==null&&(this.state.liveProctoringAlert=null,this.notify())}registerCandidateIdentity(e,s,a,n){const i=this.state.candidates.find(r=>r.id===e);i?(s&&(i.livePhotoUrl=s),a&&(i.idProofUrl=a),n!=null&&n.name&&(i.name=n.name),n!=null&&n.email&&(i.email=n.email),i.identityStatus="pending_verification"):this.state.candidates.unshift({id:e,name:(n==null?void 0:n.name)||"Candidate",email:(n==null?void 0:n.email)||"",phone:"",experienceYears:0,skills:[],status:"Assessment Sent",assessmentId:this.state.activeAssessmentId,invitedAt:new Date().toLocaleDateString(),otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!1,livePhotoUrl:s,idProofUrl:a,identityStatus:"pending_verification"}),this.state.activeCandidateId=e}approveCandidateIdentity(e){const s=this.state.candidates.find(a=>a.id===e);s&&(s.identityStatus="approved"),this.state.activeCandidateId===e&&this.startExam(),this.notify()}triggerProctorIntercom(e,s){this.state.proctorIntercomMessage=s,this.state.liveProctoringAlert=`PROCTOR INTERCOM / 360° ROOM INSPECTION: ${s}`,this.notify()}clearProctorIntercom(){var e;this.state.proctorIntercomMessage=null,(e=this.state.liveProctoringAlert)!=null&&e.includes("PROCTOR INTERCOM")&&(this.state.liveProctoringAlert=null),this.notify()}addQuestionToBank(e){this.state.questionBank.unshift(e),this.notify()}addCandidate(e){this.state.candidates.unshift(e),this.notify()}updateCandidateStatus(e,s){const a=this.state.candidates.find(n=>n.id===e);a&&(a.status=s,this.notify())}updateCandidateDecision(e,s,a){this.state.candidateResults[e]&&(this.state.candidateResults[e].recruiterDecision=s,this.state.candidateResults[e].recruiterNotes=a,this.notify())}addQuestion(e,s){if(this.state.questionBank.unshift(e),s)this.assignQuestionToSection(s,e);else{const a=this.getActiveAssessment();a&&a.sections.length>0&&a.sections[0].questions.push(e)}this.notify()}assignQuestionToSection(e,s){const a=this.getActiveAssessment();if(!a)return;a.sections.forEach(i=>{i.questions=i.questions.filter(r=>r.id!==s.id)});let n=a.sections.find(i=>i.id===e||i.name.toLowerCase()===e.toLowerCase());n||(n={id:`sec-${Date.now()}`,name:e,description:"",isMandatory:!0,instructions:`Complete all questions in ${e}.`,timeLimitMinutes:15,passingMarks:s.points||20,randomizeQuestions:!0,questions:[]},a.sections.push(n)),n.questions.push(s),this.notify()}updateQuestion(e,s){const a=this.state.questionBank.findIndex(n=>n.id===e);a!==-1&&(this.state.questionBank[a]={...this.state.questionBank[a],...s},this.notify())}deleteQuestion(e){this.state.questionBank=this.state.questionBank.filter(a=>a.id!==e);const s=this.getActiveAssessment();s&&s.sections.forEach(a=>{a.questions=a.questions.filter(n=>n.id!==e)}),this.notify()}addAssessmentSection(e){const s=this.getActiveAssessment();s&&(s.sections.push(e),this.notify())}updateAssessmentSection(e,s){const a=this.getActiveAssessment();if(a){const n=a.sections.findIndex(i=>i.id===e);n!==-1&&(a.sections[n]={...a.sections[n],...s},this.notify())}}deleteAssessmentSection(e){const s=this.getActiveAssessment();s&&s.sections.length>1&&(s.sections=s.sections.filter(a=>a.id!==e),this.notify())}}const x=new Fu,un=[{id:"python",label:"Python 3.11 (CPython)"},{id:"javascript",label:"JavaScript (Node.js)"},{id:"typescript",label:"TypeScript"},{id:"java",label:"Java"},{id:"cpp",label:"C++"},{id:"c",label:"C"},{id:"csharp",label:"C#"},{id:"go",label:"Go"},{id:"rust",label:"Rust"},{id:"kotlin",label:"Kotlin"},{id:"php",label:"PHP"},{id:"ruby",label:"Ruby"},{id:"swift",label:"Swift"},{id:"scala",label:"Scala"},{id:"sql",label:"SQL"},{id:"bash",label:"Bash"}],Nu={python:{before:`import sys

def solve(data: str) -> str:`,after:`    return ""

if __name__ == "__main__":
    sys.stdout.write(solve(sys.stdin.read()))`},javascript:{before:`const fs = require('fs');

function solve(data) {`,after:`  return '';
}

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(String(solve(input)));`},typescript:{before:`import fs from 'fs';

function solve(data: string): string {`,after:`  return '';
}

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(solve(input));`},java:{before:`import java.nio.charset.StandardCharsets;

public class Main {
    static String solve(String data) {`,after:`        return "";
    }

    public static void main(String[] args) throws Exception {
        String data = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        System.out.print(solve(data));
    }
}`},cpp:{before:`#include <iostream>
#include <iterator>
#include <string>
using namespace std;

string solve(const string& data) {`,after:`    return "";
}

int main() {
    string data((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    cout << solve(data);
    return 0;
}`},c:{before:`#include <stdio.h>

void solve(const char *data) {`,after:`}

int main(void) {
    char buf[65536];
    size_t n = fread(buf, 1, sizeof(buf) - 1, stdin);
    buf[n] = '\\0';
    solve(buf);
    return 0;
}`},csharp:{before:`using System;

string Solve(string data) {`,after:`    return "";
}

var data = Console.In.ReadToEnd();
Console.Write(Solve(data));`},go:{before:`package main

import (
	"fmt"
	"io"
	"os"
)

func solve(data string) string {`,after:`	return ""
}

func main() {
	data, _ := io.ReadAll(os.Stdin)
	fmt.Print(solve(string(data)))
}`},rust:{before:`use std::io::{self, Read};

fn solve(data: &str) -> String {`,after:`    String::new()
}

fn main() {
    let mut data = String::new();
    io::stdin().read_to_string(&mut data).ok();
    print!("{}", solve(&data));
}`},kotlin:{before:"fun solve(data: String): String {",after:`    return ""
}

fun main() {
    val data = generateSequence(::readLine).joinToString("\\n")
    print(solve(data))
}`},php:{before:`<?php
function solve(string $data): string {`,after:`    return "";
}

$data = stream_get_contents(STDIN);
echo solve($data === false ? "" : $data);`},ruby:{before:"def solve(data)",after:`  ""
end

data = STDIN.read
print solve(data)`},swift:{before:`import Foundation

func solve(_ data: String) -> String {`,after:`    return ""
}

let data = String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""
print(solve(data), terminator: "")`},scala:{before:`object Main {
  def solve(data: String): String = {`,after:`    ""
  }

  def main(args: Array[String]): Unit = {
    val data = scala.io.Source.stdin.mkString
    print(solve(data))
  }
}`},sql:{before:`-- Write the query below.
SELECT`,after:";"},bash:{before:`#!/usr/bin/env bash
set -euo pipefail

solve() {`,after:`  printf '%s' ""
}

data="$(cat)"
solve "$data"`}};function Ii(t){const e=Nu[t];return e?{before:e.before,after:e.after}:{before:"",after:""}}function pd(t,e){const s=t==null?void 0:t[e];if(!s||typeof s=="string")return null;const a=String(s.before||""),n=String(s.after||"");return!a.trim()&&!n.trim()?null:{before:a,after:n}}function Mi(t,e,s){const a=t.replace(/\n+$/,""),n=s.replace(/^\n+/,""),i=e.replace(/^\n+|\n+$/g,""),r=[];return a&&r.push(a),r.push(i),n&&r.push(n),r.join(`
`)}function yo(t,e,s){const a=e.replace(/\n+$/,""),n=s.replace(/^\n+/,"");let i=t;if(a){if(!i.startsWith(a))return null;i=i.slice(a.length).replace(/^\n/,"")}if(n){if(!i.endsWith(n))return null;i=i.slice(0,i.length-n.length).replace(/\n$/,"")}return i}function Bu(t,e){const s=pd(t,e);if(s)return Mi(s.before,"",s.after);const a=t==null?void 0:t[e];if(typeof a=="string"&&a.trim())return a;const n=Ii(e);return!n.before.trim()&&!n.after.trim()?"":Mi(n.before,"",n.after)}function hd(t){const e=t==null?void 0:t.inputs;return Array.isArray(e)&&e.length>0?e.map(s=>String(s??"")):[(t==null?void 0:t.input)??""]}const Ts=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function wo(t){return t.map((e,s)=>`<div class="text-slate-400 text-[11px] whitespace-pre-wrap">Input ${s+1}: <code class="text-blue-300">${Ts(e)}</code></div>`).join("")}let Ra=null,fa=null;function is(){try{fa==null||fa()}catch{}}class Hu{constructor(e,s){h(this,"container");h(this,"question");h(this,"currentLanguage");h(this,"currentCode","");h(this,"editorInstance",null);h(this,"parts",null);h(this,"middle","");h(this,"applying",!1);this.container=e,this.question=s,this.currentLanguage=x.recallLanguage(s.id)||s.language||"python",un.some(a=>a.id===this.currentLanguage)||(this.currentLanguage="python"),this.loadBuffer(this.currentLanguage,x.recallCode(s.id,this.currentLanguage))}render(){this.container.innerHTML=`
      <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div class="glass-panel px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
            <select id="lang-select" class="glass-input text-xs font-mono font-semibold px-3 py-1 rounded-lg border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500">
              ${un.map(e=>`
                <option value="${e.id}" ${this.currentLanguage===e.id?"selected":""}>${Ts(e.label)}</option>
              `).join("")}
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span id="draft-status" class="text-[10px] font-mono text-slate-500">Draft saved</span>
            <button id="run-code-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <span>▶</span> Run Tests
            </button>
            <button id="submit-code-btn" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <span>✓</span> Submit Solution
            </button>
          </div>
        </div>
        <div class="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-5 overflow-hidden">
          <div class="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 min-h-0">
            ${this.parts?'<p class="px-3 py-1 text-[10px] text-blue-300/80 border-b border-slate-800">Write between the locked starter lines. Those lines stay as the recruiter set them.</p>':""}
            <div id="monaco-host" class="flex-1 w-full h-full min-h-[300px]"></div>
          </div>
          <div class="lg:col-span-2 flex flex-col bg-slate-900/90 overflow-hidden min-h-0">
            <div class="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Case Execution</span>
              <span id="exec-metrics" class="text-[11px] font-mono text-slate-400">Ready</span>
            </div>
            <div id="console-output" class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
              <p class="text-slate-500 italic">Run Tests compiles this program and checks it against the question's cases.</p>
              ${(this.question.testCases||[]).map((e,s)=>`
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span class="font-semibold text-slate-300">Test Case ${s+1}</span>
                  ${e.isHidden?'<div class="text-slate-500 text-[11px] italic">Input and expected output are hidden.</div>':`
                    ${wo(hd(e))}
                    <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${Ts(e.expectedOutput)}</code></div>
                  `}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `,this.initMonaco(),this.attachEvents()}loadBuffer(e,s){this.currentLanguage=e;const a=pd(this.question.sampleCode,e),n=Bu(this.question.sampleCode,e),i=s!==null?s:n,r=a?yo(i,a.before,a.after):i;a&&r!==null?(this.parts=a,this.middle=r,this.currentCode=i):(this.parts=null,this.middle=i,this.currentCode=i)}initMonaco(){const e=this.container.querySelector("#monaco-host");if(!e)return;const s=window.monaco;if(s){this.createMonacoInstance(s,e);return}const a=window.require;if(a){a.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs"}}),a(["vs/editor/editor.main"],()=>{this.container.querySelector("#monaco-host")&&this.createMonacoInstance(window.monaco,e)});return}this.renderTextareaFallback(e)}createMonacoInstance(e,s){if(Ra){try{Ra.dispose()}catch{}Ra=null}s.innerHTML="",this.editorInstance=e.editor.create(s,{value:this.currentCode,language:this.monacoLanguage(this.currentLanguage),theme:"vs-dark",automaticLayout:!0,fontSize:13,fontFamily:"'Fira Code', 'JetBrains Mono', monospace",minimap:{enabled:!1},scrollBeyondLastLine:!1,lineNumbers:"on",roundedSelection:!0,tabSize:4,insertSpaces:!0,autoClosingBrackets:"always",autoClosingQuotes:"always",autoIndent:"full",formatOnType:!0,wordWrap:"on",scrollbar:{verticalScrollbarSize:8,horizontalScrollbarSize:8}}),Ra=this.editorInstance,fa=()=>this.onBufferChanged(this.getCodeValue()),this.markEditable(e),this.editorInstance.onDidChangeModelContent(()=>{this.applying||this.onBufferChanged(this.editorInstance.getValue())})}markEditable(e){if(!this.parts||!this.editorInstance)return;const s=this.editorInstance.getModel();if(!s)return;const a=this.parts.before.trim()?this.parts.before.replace(/\n+$/,"").split(`
`).length:0,n=this.parts.after.trim()?this.parts.after.replace(/^\n+/,"").split(`
`).length:0,i=s.getLineCount(),r=a+1,o=Math.max(r,i-n),l=[];a>0&&l.push({range:new e.Range(1,1,a,1),options:{isWholeLine:!0,className:"bg-slate-900/40",glyphMarginClassName:""}}),l.push({range:new e.Range(r,1,o,1),options:{isWholeLine:!0,className:"bg-blue-500/10"}}),n>0&&i-n+1<=i&&l.push({range:new e.Range(i-n+1,1,i,1),options:{isWholeLine:!0}}),this.editorInstance.deltaDecorations([],l)}onBufferChanged(e){if(this.parts){const a=yo(e,this.parts.before,this.parts.after);if(a===null){const n=Mi(this.parts.before,this.middle,this.parts.after);this.pushValue(n),x.noteCodeDraft(this.question.id,this.currentLanguage,n);return}this.middle=a}else this.middle=e;this.currentCode=e,x.noteCodeDraft(this.question.id,this.currentLanguage,e);const s=this.container.querySelector("#draft-status");s&&(s.textContent="Draft saved")}pushValue(e){if(this.applying=!0,this.currentCode=e,this.editorInstance)this.editorInstance.setValue(e);else{const s=this.container.querySelector("#fallback-code-area");s&&(s.value=e)}this.applying=!1}monacoLanguage(e){return{python:"python",javascript:"javascript",typescript:"typescript",sql:"sql",cpp:"cpp",c:"c",java:"java",csharp:"csharp",go:"go",rust:"rust",kotlin:"kotlin",swift:"swift",php:"php",ruby:"ruby",scala:"scala",bash:"shell"}[e]||"plaintext"}renderTextareaFallback(e){e.innerHTML=`
      <textarea id="fallback-code-area" class="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm border-0 focus:ring-0 resize-none outline-none" spellcheck="false"></textarea>
    `;const s=e.querySelector("#fallback-code-area");s.value=this.currentCode,fa=()=>this.onBufferChanged(s.value),s.addEventListener("input",()=>{this.applying||this.onBufferChanged(s.value)})}getCodeValue(){if(this.editorInstance)return this.editorInstance.getValue();const e=this.container.querySelector("#fallback-code-area");return e?e.value:this.currentCode}attachEvents(){const e=this.container.querySelector("#lang-select"),s=this.container.querySelector("#run-code-btn"),a=this.container.querySelector("#submit-code-btn"),n=this.container.querySelector("#console-output"),i=this.container.querySelector("#exec-metrics");e==null||e.addEventListener("change",()=>{if(x.noteCodeDraft(this.question.id,this.currentLanguage,this.getCodeValue()),this.loadBuffer(e.value,x.recallCode(this.question.id,e.value)),this.editorInstance){const o=window.monaco;this.applying=!0,o==null||o.editor.setModelLanguage(this.editorInstance.getModel(),this.monacoLanguage(this.currentLanguage)),this.editorInstance.setValue(this.currentCode),this.applying=!1,this.markEditable(o)}else{const o=this.container.querySelector("#fallback-code-area");o&&(o.value=this.currentCode)}});const r=async()=>{s.disabled=!0,s.innerHTML="<span>⌛</span> Compiling...",i.textContent="Running...";const o=this.getCodeValue();x.noteCodeDraft(this.question.id,this.currentLanguage,o);let l;try{l=await Lu.executeCode(this.currentLanguage,o,this.question.id)}catch(c){return s.disabled=!1,s.innerHTML="<span>▶</span> Run Tests",i.textContent="Execution failed",n.textContent=c instanceof Error?c.message:String(c),null}s.disabled=!1,s.innerHTML="<span>▶</span> Run Tests",i.innerHTML=`Time: <b class="text-blue-400">${l.executionTimeMs}ms</b>`;const d=l.testResults.filter(c=>c.passed).length;return n.innerHTML=`
        ${l.stderr?`<pre class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 whitespace-pre-wrap">${Ts(l.stderr)}</pre>`:""}
        <div class="p-3 rounded-xl border ${l.passed?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400":"bg-red-500/10 border-red-500/30 text-red-400"} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${l.passed?"All test cases passed":"Tests failed"}</span>
          <span class="font-mono font-bold">${d} / ${l.testResults.length}</span>
        </div>
        ${l.testResults.map((c,u)=>`
          <div class="p-3 rounded-xl bg-slate-950 border ${c.passed?"border-emerald-500/30":"border-red-500/30"} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${u+1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${c.passed?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400"}">${c.passed?"PASSED":"FAILED"}</span>
            </div>
            ${c.isHidden?'<div class="text-slate-500 text-[11px] italic">Output hidden.</div>':`
              ${wo(c.inputs&&c.inputs.length?c.inputs:[c.input])}
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${Ts(c.expected)}</code></div>
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Actual: <code class="${c.passed?"text-emerald-400":"text-red-400"}">${Ts(c.actual)}</code></div>
            `}
          </div>
        `).join("")}
      `,l};s==null||s.addEventListener("click",()=>{r()}),a==null||a.addEventListener("click",async()=>{const o=await r(),l=this.getCodeValue();x.setCodeSubmission(this.question.id,{code:l,language:this.currentLanguage,executionTimeMs:o==null?void 0:o.executionTimeMs,passedCount:o==null?void 0:o.testResults.filter(d=>d.passed).length,totalCount:o==null?void 0:o.testResults.length}),a.innerHTML="<span>✓</span> Saved",a.classList.replace("bg-blue-600","bg-emerald-600")})}}const q={navy:"#0f2744",phone:"+1 (415) 215-3527",phoneHref:"tel:+14152153527",email:"partnerships@confered.com",bookUrl:"https://outlook.office.com/book/MediaLearningTechnologyConsultationDigiVisionConferED@confered.com/?ismsaljsauthenabled",site:"https://www.confered.com",locations:"Aurora, CO · Huntersville, NC · Hayden, ID",copyright:"Copyright 2026 ConferED LLC. All rights reserved.",since:"Digital conference recording since 2006"},ya={admin:{key:"admin",name:"System Administrator",badge:"Security & Governance",accentColor:"#3b82f6",accentLight:"rgba(59, 130, 246, 0.12)",accentBorder:"rgba(59, 130, 246, 0.35)",gradient:"from-blue-600 to-indigo-600",hoverGradient:"hover:from-blue-500 hover:to-indigo-500",shadowGlow:"shadow-blue-600/25",icon:"🛡️",tagline:"Staff accounts, role management, audit logs, and global security policies.",features:["Staff IAM & Permissions","Audit Logs & IP Tracking","Global Proctoring Rules"]},recruiter:{key:"recruiter",name:"Recruiter & HR Workspace",badge:"Talent Pipeline",accentColor:"#6366f1",accentLight:"rgba(99, 102, 241, 0.12)",accentBorder:"rgba(99, 102, 241, 0.35)",gradient:"from-indigo-600 to-purple-600",hoverGradient:"hover:from-indigo-500 hover:to-purple-500",shadowGlow:"shadow-indigo-600/25",icon:"💼",tagline:"Build multi-section exams, question banks, invite candidates, and evaluate scores.",features:["Automated Coding IDE","Question Bank Manager","Candidate Pipeline Tracking"]},proctor:{key:"proctor",name:"Live Proctoring Monitor",badge:"Real-Time Proctor Deck",accentColor:"#10b981",accentLight:"rgba(16, 185, 129, 0.12)",accentBorder:"rgba(16, 185, 129, 0.35)",gradient:"from-emerald-600 to-teal-600",hoverGradient:"hover:from-emerald-500 hover:to-teal-500",shadowGlow:"shadow-emerald-600/25",icon:"📹",tagline:"Live multi-camera streaming, real-time AI violation alerts, and direct proctor intercom.",features:["Zero-Latency Live Grid","Automated AI Violation Feed","Two-Way Audio Intercom"]}},fd=(t="onDark",e="h-11 sm:h-12 md:h-14 w-auto")=>`<img src="/confered-logo.png" alt="ConferED — Capture. Transform. Engage." class="${e} object-contain transition-opacity hover:opacity-95 shrink-0" />`,An={admin:[{tab:"overview",icon:"📊",label:"Dashboard & Health",slug:"dashboard"},{tab:"staff",icon:"👥",label:"Staff Management",slug:"staff-management"},{tab:"settings",icon:"⚙️",label:"Global System Settings",slug:"global-system-settings"},{tab:"audit",icon:"📜",label:"Audit Logs",slug:"audit-logs"}],recruiter:[{tab:"pipeline",icon:"📋",label:"Hiring Pipeline",slug:"hiringpipeline"},{tab:"assessment-builder",icon:"🛠️",label:"Assessment Builder",slug:"assessment-builder"},{tab:"question-bank",icon:"🗂️",label:"Question Bank",slug:"question-bank"}],proctor:[{tab:"live",icon:"📹",label:"Live Monitoring"},{tab:"identity-verification",icon:"📸",label:"Identity & ID Verification",slug:"identity-verification"}]},Rs={admin:"overview",recruiter:"pipeline",proctor:"live"},wa={...Rs},Sa=t=>An[t].some(s=>s.tab===wa[t])?wa[t]:Rs[t],Uu=(t,e)=>{if(t==="recruiter"&&e.startsWith("candidates/")){wa[t]="pipeline";return}const s=An[t].find(a=>(a.slug||"")===e);wa[t]=s?s.tab:Rs[t]},Vu=()=>{Object.keys(Rs).forEach(t=>{wa[t]=Rs[t]})},bd=["admin","recruiter","proctor"],jt={admin:{portal:"admin",path:"/admin",role:"System Admin",title:"System Administrator",loginTitle:"System Admin Portal",icon:"🛡️",blurb:"Staff accounts, global settings and audit logs.",menuTitle:"Administration"},recruiter:{portal:"recruiter",path:"/recruiter",role:"Recruiter",title:"Recruiter / HR Workspace",loginTitle:"Recruiter Portal",icon:"💼",blurb:"Build assessments and the question bank, invite candidates and review results.",menuTitle:"Hiring"},proctor:{portal:"proctor",path:"/proctor",role:"Proctor",title:"Live Proctoring Monitor",loginTitle:"Proctoring Monitor",icon:"📹",blurb:"Verify identities, watch live sessions and act on violations.",menuTitle:"Proctoring"}};function Os(){const t=window.location.pathname.replace(/\/+$/,"")||"/";for(const e of bd){const s=jt[e].path;if(t===s||t.startsWith(`${s}/`))return{kind:"staff",portal:e,section:t===s?"":t.slice(s.length+1)}}return{kind:"candidate"}}function Tn(t,e,s=""){const a=An[t].find(r=>r.tab===e),n=jt[t].path,i=a!=null&&a.slug?`${n}/${a.slug}`:n;return s?`${i}#${s}`:i}function ka(t){return Tn(t,Rs[t])}const md=[];let So=!1;function ko(){md.forEach(t=>t())}const $e={navigate(t){const e=window.location.pathname+window.location.search+window.location.hash;t!==e&&(window.history.pushState({},"",t),ko())},subscribe(t){md.push(t),So||(So=!0,window.addEventListener("popstate",ko))}},Re=q.site;class Gu{constructor(e,s="full"){h(this,"container");h(this,"mode");this.container=e,this.mode=s}render(){this.mode==="small"?this.renderSmall():this.renderFull()}renderSmall(){this.container.innerHTML=`
      <footer class="mt-auto border-t border-slate-800/80 text-slate-400 text-xs py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 transition-colors select-none" style="background: #081628;">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 font-sans">
          <div class="text-slate-400 text-xs">
            Copyright 2026 ConferED LLC. All rights reserved.
          </div>

          <div class="flex items-center gap-3.5 text-xs">
            <a href="${q.phoneHref}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#f43f5e]">📞</span>
              <span>${q.phone}</span>
            </a>
            <span class="text-slate-600">·</span>
            <a href="mailto:${q.email}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#818cf8]">✉️</span>
              <span>${q.email}</span>
            </a>
          </div>
        </div>
      </footer>
    `}renderFull(){this.container.innerHTML=`
      <footer class="mt-auto text-white" style="background:${q.navy}">
        <div class="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            
            <!-- Brand Column -->
            <div class="space-y-4">
              <a href="/" data-route="/" class="inline-block hover:opacity-90">
                ${fd("onDark","h-11 sm:h-12 w-auto")}
              </a>
              <p class="text-sm leading-relaxed text-white/70">
                ConferED Talent Assess delivers high-stakes, AI-monitored technical and cognitive assessments for organizations, universities, and associations.
              </p>
              <p class="text-sm text-white/65">${q.locations}</p>
              <div class="space-y-1.5 text-sm">
                <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer" class="block font-semibold text-white hover:text-orange-400">Book a consultation</a>
                <a href="${q.phoneHref}" class="block text-white/80 hover:text-white">${q.phone}</a>
                <a href="mailto:${q.email}" class="block text-white/80 hover:text-white">${q.email}</a>
              </div>
            </div>

            <!-- Products Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Products</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="/" data-route="/" class="text-white hover:text-orange-400">Talent Assess</a></li>
                <li><a href="/recruiter" data-route="/recruiter" class="text-white hover:text-orange-400">Recruiter Workspace</a></li>
                <li><a href="/proctor" data-route="/proctor" class="text-white hover:text-orange-400">Live Proctoring</a></li>
                <li><a href="/admin" data-route="/admin" class="text-white hover:text-orange-400">System Admin</a></li>
                <li><a href="${Re}/lms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">ConferLMS</a></li>
                <li><a href="${Re}/digivision-media" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">DigiVision Media</a></li>
              </ul>
            </div>

            <!-- Company Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Company</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${Re}/who-we-serve" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Who we serve</a></li>
                <li><a href="${Re}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Associations</a></li>
                <li><a href="${Re}/experience" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Experience</a></li>
                <li><a href="${Re}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partners</a></li>
                <li><a href="${Re}/about" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">About ConferED</a></li>
                <li><a href="${Re}/careers" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Careers</a></li>
              </ul>
            </div>

            <!-- Talk Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Talk to Us</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer" class="block text-white hover:text-orange-400 font-semibold">📅 Book a consultation</a></li>
                <li><a href="${Re}/contact" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Contact & Support</a></li>
                <li><a href="${Re}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partnerships</a></li>
                <li><a href="${Re}/privacy" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="${Re}/terms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Terms of Service</a></li>
                <li><a href="${Re}/cookies" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Cookie Settings</a></li>
              </ul>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
            <p>${q.copyright} · ${q.since}</p>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    `,this.container.querySelectorAll("[data-route]").forEach(e=>{e.addEventListener("click",s=>{s.preventDefault(),$e.navigate(e.getAttribute("data-route")||"/")})})}}const Oa=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class Wu{constructor(e){h(this,"container");h(this,"mobileMenuOpen",!1);this.container=e}render(){const e=x.getState(),s=Os(),a=e.currentUser,n=new URLSearchParams(window.location.search),i=n.has("invite")||n.has("assessment"),r=s.kind==="staff"&&e.isStaffAuthenticated&&!!a,o=s.kind==="staff"&&!e.isStaffAuthenticated,l=!!e.examStarted,d=!r&&!o&&!l&&!i;this.container.innerHTML=`
      <header class="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 backdrop-blur-md border-b border-slate-800 bg-[#070e17]/95 text-slate-100 shadow-xl transition-all">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <!-- Left: Logo (clickable redirect) + Divider + "Talent Assess" (medium text, non-clickable) -->
          <div class="flex items-center gap-3 sm:gap-4 shrink-0">
            <a href="/" id="brand-logo-btn" class="inline-flex items-center shrink-0 ${i?"pointer-events-none":"cursor-pointer hover:opacity-90 transition-opacity"}" title="ConferED Home">
              ${fd("onDark","h-11 sm:h-12 md:h-13 w-auto")}
            </a>
            <div class="h-7 sm:h-8 w-px bg-slate-700/80 mx-0.5 select-none pointer-events-none"></div>
            <span class="text-sm sm:text-base font-medium tracking-normal text-slate-200 select-none whitespace-nowrap cursor-default pointer-events-none">
              Talent Assess
            </span>
          </div>

          <!-- Center: Main ConferED Platform Navigation Tabs (ONLY on public pages, hidden after login) -->
          ${d?`
            <nav class="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-200">
              
              <!-- Solutions Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Solutions</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-72 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${q.site}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Associations & Societies</div>
                      <div class="text-[11px] text-slate-400">Annual conferences, member portals, and continuing education.</div>
                    </a>
                    <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Organizations & Enterprise</div>
                      <div class="text-[11px] text-slate-400">High-stakes talent assessment, certifications, and compliance.</div>
                    </a>
                    <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Healthcare & Medical</div>
                      <div class="text-[11px] text-slate-400">CME accredited video archives and proctored clinical evaluations.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Products Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Products</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-80 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="#workspaces-section" class="nav-internal-link block p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                      <div class="font-semibold text-blue-400 text-xs flex items-center justify-between">
                        <span>Talent Assess Suite</span>
                        <span class="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">Active</span>
                      </div>
                      <div class="text-[11px] text-slate-300">Enterprise AI proctoring, coding IDE, and automated grading.</div>
                    </a>
                    <a href="${q.site}/lms" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">ConferLMS</div>
                      <div class="text-[11px] text-slate-400">Next-gen learning platform built for continuing education.</div>
                    </a>
                    <a href="${q.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">DigiVision Media</div>
                      <div class="text-[11px] text-slate-400">Conference video capture and synchronized slide recording.</div>
                    </a>
                    <a href="${q.site}/event-capture" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Virtual & Hybrid Events</div>
                      <div class="text-[11px] text-slate-400">End-to-end event broadcasting and live attendee streaming.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Standalone Direct Tabs -->
              <a href="${q.site}/experience" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Experience
              </a>

              <a href="${q.site}/partners" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Partners
              </a>

              <!-- Company Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Company</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-64 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${q.site}/about" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">About ConferED</div>
                      <div class="text-[11px] text-slate-400">Delivering digital conference technology since 2006.</div>
                    </a>
                    <a href="${q.site}/why-confered" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Why ConferED</div>
                      <div class="text-[11px] text-slate-400">Our customer-first media and assessment architecture.</div>
                    </a>
                    <a href="${q.site}/careers" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Careers</div>
                      <div class="text-[11px] text-slate-400">Join our engineering and operations team.</div>
                    </a>
                  </div>
                </div>
              </div>

              <a href="${q.site}/contact" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Contact
              </a>
            </nav>
          `:""}

          <!-- Right Controls: Book a consultation CTA + Staff Info -->
          <div class="flex items-center gap-3">
            
            ${o?`
              <button id="back-to-home-btn" class="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-1.5 shadow-sm">
                <span>←</span> <span>All Workspaces</span>
              </button>
            `:""}

            <!-- Official ConferED Orange "Book a consultation" button (Public pages only) -->
            ${d?`
              <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="hidden sm:inline-flex items-center justify-center font-bold text-xs sm:text-sm text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            `:""}

            <!-- Signed-in User Info & Logout (Staff Workspace) -->
            ${r?this.staffControlsHtml():""}

            <!-- Exam Recording Badge (Active Candidate Exam) -->
            ${l?`
              <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider">Recording</span>
                <span class="text-[10px] font-bold text-slate-300">${e.violationCount}/${e.settings.maxViolationsBeforeTerminate}</span>
              </div>
            `:""}

            <!-- Mobile Menu Toggle Button (Hamburger) - Public pages only -->
            ${d?`
              <button id="mobile-menu-toggle-btn" class="xl:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/80 focus:outline-none" aria-label="Toggle navigation menu">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            `:""}

          </div>

        </div>

        <!-- Mobile Navigation Drawer (Public pages only) -->
        ${d?`
          <div id="mobile-nav-drawer" class="hidden xl:hidden border-t border-slate-800/80 mt-3 pt-4 pb-2 space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs font-medium text-slate-200">
              <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Solutions ➔
              </a>
              <a href="#workspaces-section" class="nav-internal-link p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Talent Assess ➔
              </a>
              <a href="${q.site}/lms" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                ConferLMS ➔
              </a>
              <a href="${q.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                DigiVision Media ➔
              </a>
              <a href="${q.site}/experience" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Experience
              </a>
              <a href="${q.site}/partners" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Partners
              </a>
              <a href="${q.site}/about" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Company
              </a>
              <a href="${q.site}/contact" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Contact
              </a>
            </div>

            <div class="pt-2">
              <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="block w-full text-center font-bold text-xs text-white py-2.5 rounded-lg shadow"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            </div>
          </div>
        `:""}

      </header>
    `,this.attachEvents()}staffControlsHtml(){const e=x.getState().currentUser,a=(e.name||e.email||"User").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();return`
      <div class="flex items-center gap-2.5 pl-2">
        <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm" title="${Oa(e.role)}">
          ${Oa(a)}
        </div>
        <div class="flex flex-col text-left">
          <span class="text-xs font-bold leading-tight text-white">${Oa(e.name||e.email)}</span>
          <span class="text-[10px] text-slate-400 leading-tight">${Oa(e.role)}</span>
        </div>
      </div>

      <button id="logout-btn" class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-slate-700/80 shadow-sm ml-2">
        <span>🚪</span> <span>Logout</span>
      </button>
    `}attachEvents(){var n,i,r;const e=o=>this.container.querySelector(o);(n=e("#brand-logo-btn"))==null||n.addEventListener("click",o=>{o.preventDefault();const l=new URLSearchParams(window.location.search);if(l.has("invite")||l.has("assessment"))return;const d=Os();d.kind==="staff"&&x.getState().isStaffAuthenticated?$e.navigate(ka(d.portal)):$e.navigate("/")}),(i=e("#back-to-home-btn"))==null||i.addEventListener("click",()=>{$e.navigate("/")}),(r=e("#logout-btn"))==null||r.addEventListener("click",()=>{x.logoutStaff().catch(()=>{})});const s=e("#mobile-menu-toggle-btn"),a=e("#mobile-nav-drawer");s&&a&&s.addEventListener("click",()=>{this.mobileMenuOpen=!this.mobileMenuOpen,this.mobileMenuOpen?a.classList.remove("hidden"):a.classList.add("hidden")}),this.container.querySelectorAll(".nav-internal-link").forEach(o=>{o.addEventListener("click",l=>{const d=(o.getAttribute("href")||"").replace("#",""),c=document.getElementById(d);c&&(l.preventDefault(),c.scrollIntoView({behavior:"smooth"}),a&&(a.classList.add("hidden"),this.mobileMenuOpen=!1))})})}}class zu{constructor(e,s){h(this,"container");h(this,"active");this.container=e,this.active=s}render(){const e=x.getState(),s=Sa(this.active),a=ya[this.active],n=e.theme==="light";e.currentUser;const i=e.allowedPortals.length>1,r=o=>o?`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-3 bg-gradient-to-r ${a.gradient} ${a.shadowGlow}`:`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 ${n?"text-slate-600 hover:text-slate-900 hover:bg-slate-100":"text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"}`;this.container.innerHTML=`
      <div class="flex flex-col h-full justify-between space-y-6">
        
        <div class="space-y-5">
          <!-- Active Workspace Header Badge -->
          <div class="px-2 py-3 rounded-2xl border transition-all ${n?"bg-white border-slate-200/90 shadow-sm":"bg-slate-900/70 border-slate-800"}">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                   style="background:${a.accentLight}; border:1px solid ${a.accentBorder}">
                ${a.icon}
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold truncate ${n?"text-slate-900":"text-white"}">
                  ${a.name}
                </span>
                <span class="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
                </span>
              </div>
            </div>
          </div>

          <!-- Multi-Workspace Switcher (only shown if account has multiple permissions) -->
          ${i?`
            <div>
              <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Workspaces</p>
              <div class="space-y-1">
                ${e.allowedPortals.map(o=>{const l=ya[o],d=o===this.active;return`
                    <button data-portal="${o}" class="side-portal w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5
                            ${d?n?"bg-slate-100 text-blue-900 font-bold":"bg-slate-800 text-blue-400 font-bold":n?"text-slate-500 hover:bg-slate-50":"text-slate-400 hover:bg-slate-800/40"}">
                      <span class="text-sm leading-none">${l.icon}</span>
                      <span class="truncate">${l.name}</span>
                    </button>
                  `}).join("")}
              </div>
            </div>
          `:""}

          <!-- Portal Navigation Menu -->
          <nav class="space-y-1" aria-label="Portal sections">
            <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ${jt[this.active].menuTitle}
            </p>
            ${An[this.active].map(o=>`
              <button data-nav-tab="${o.tab}" class="side-nav ${r(o.tab===s)}">
                <span class="text-base leading-none">${o.icon}</span>
                <span class="truncate">${o.label}</span>
              </button>
            `).join("")}
          </nav>
        </div>

      </div>
    `,this.container.querySelectorAll(".side-portal").forEach(o=>o.addEventListener("click",l=>{const d=l.currentTarget.getAttribute("data-portal");T.setActivePortal(d),$e.navigate(ka(d))})),this.container.querySelectorAll(".side-nav").forEach(o=>o.addEventListener("click",l=>{const d=l.currentTarget.getAttribute("data-nav-tab");$e.navigate(Tn(this.active,d))}))}}function ys(t){const e=new URLSearchParams;Object.entries(t).forEach(([a,n])=>{n!=null&&n!==""&&e.set(a,String(n))});const s=e.toString();return s?`?${s}`:""}const Ce=t=>T.fetchJson(t,"GET"),Ft=(t,e)=>T.fetchJson(t,"POST",e),Fa=(t,e)=>T.fetchJson(t,"PATCH",e),ni=t=>T.fetchJson(t,"DELETE"),N={dashboard:{staff:()=>Ce("/admin/dashboard/staff"),security:t=>Ce(`/admin/dashboard/security${ys({hours:t})}`),activity:(t=10,e)=>Ce(`/admin/dashboard/activity${ys({limit:t,category:e})}`),invites:()=>Ce("/admin/dashboard/invites"),health:()=>Ce("/admin/dashboard/health"),probeEmail:()=>Ft("/admin/dashboard/health/email-probe")},staff:{search:t=>Ce(`/admin/staff/search${ys(t)}`),detail:t=>Ce(`/admin/staff/${t}`),create:t=>Ft("/admin/staff",t),setRole:(t,e)=>Fa(`/admin/staff/${t}`,{role:e}),setActive:(t,e)=>Fa(`/admin/staff/${t}`,{isActive:e}),updateProfile:(t,e)=>Fa(`/admin/staff/${t}/profile`,e),unlock:t=>Ft(`/admin/staff/${t}/unlock`),forceLogout:t=>Ft(`/admin/staff/${t}/force-logout`),resendCredentials:t=>Ft(`/admin/staff/${t}/resend-credentials`),resetPassword:t=>Ft(`/admin/staff/${t}/reset-password`),remove:t=>ni(`/admin/staff/${t}`),restore:t=>Ft(`/admin/staff/${t}/restore`),sessions:t=>Ce(`/admin/staff/${t}/sessions`),endSession:(t,e)=>ni(`/admin/staff/${t}/sessions/${encodeURIComponent(e)}`)},settings:{schema:()=>Ce("/admin/settings/schema"),all:()=>Ce("/admin/settings"),group:t=>Ce(`/admin/settings/${t}`),update:(t,e)=>Fa(`/admin/settings/${t}`,e),clearEmailPassword:()=>ni("/admin/settings/email/password"),testEmail:t=>Ft("/admin/settings/email/test",t?{to:t}:{})},audit:{list:t=>Ce(`/admin/audit-logs${ys(t)}`),meta:()=>Ce("/admin/audit-logs/meta"),exportCsv:t=>{const{page:e,pageSize:s,...a}=t;return T.downloadFile(`/admin/audit-logs/export${ys(a)}`)},loginEvents:t=>Ce(`/admin/login-events${ys(t)}`)}},m=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Ge=t=>t instanceof H?t.message:"Something went wrong. Please try again.";function gd(t,e){let s;return(...a)=>{window.clearTimeout(s),s=window.setTimeout(()=>t(...a),e)}}const Pi=t=>String(t).padStart(2,"0"),xd=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";function ir(t,e,s){const a={};for(const n of new Intl.DateTimeFormat("en-GB",{timeZone:e,day:"numeric",month:s,year:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(t))n.type!=="literal"&&(a[n.type]=n.value);return a}function Ve(t){if(!t)return"—";const e=new Date(t);if(isNaN(e.getTime()))return"—";const s=ir(e,xd(),"short"),a=s.hour==="24"?"00":s.hour;return`${s.day} ${s.month} ${s.year}, ${Pi(a)}:${Pi(s.minute)}`}function vd(t){if(!t)return"—";const e=new Date(t);if(isNaN(e.getTime()))return"—";const s=ir(e,xd(),"short");return`${s.day} ${s.month} ${s.year}`}function Ju(t,e){const s=new Date(t);if(isNaN(s.getTime()))return"—";const a=ir(s,"UTC","numeric"),n=a.hour==="24"?"00":a.hour;return e==="hour"?`${Pi(n)}:00`:`${Number(a.day)}/${Number(a.month)}`}function _s(t,e=Date.now()){if(!t)return"never";const s=new Date(t).getTime();if(isNaN(s))return"—";const a=Math.max(0,Math.round((e-s)/1e3));return a<45?"just now":a<3600?`${Math.max(1,Math.round(a/60))} min ago`:a<86400?`${Math.round(a/3600)} h ago`:a<30*86400?`${Math.round(a/86400)} d ago`:vd(t)}function Qu(t){const e=Math.floor(t/86400),s=Math.floor(t%86400/3600),a=Math.floor(t%3600/60);return e?`${e}d ${s}h`:s?`${s}h ${a}m`:`${a}m ${t%60}s`}function ji(t){if(!t)return"Unknown device";const e=t,s=/Edg\//.test(e)?"Edge":/OPR\//.test(e)?"Opera":/Firefox\//.test(e)?"Firefox":/Chrome\//.test(e)?"Chrome":/Safari\//.test(e)?"Safari":/python|httpx|curl/i.test(e)?"Script":"",a=/Windows/.test(e)?"Windows":/Android/.test(e)?"Android":/iPhone|iPad/.test(e)?"iOS":/Mac OS X/.test(e)?"macOS":/Linux/.test(e)?"Linux":"";return s&&a?`${s} on ${a}`:s||a||e.slice(0,40)}const Za={green:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",red:"bg-red-500/10 text-red-400 border-red-500/20",amber:"bg-amber-500/10 text-amber-400 border-amber-500/20",blue:"bg-blue-500/10 text-blue-400 border-blue-500/20",purple:"bg-purple-500/10 text-purple-400 border-purple-500/20",slate:"bg-slate-500/10 text-slate-400 border-slate-500/20"};function Me(t,e="slate"){return`<span class="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border ${Za[e]}">${m(t)}</span>`}let ts=null;function ct(t,e="info",s=4500){var r;(!ts||!ts.isConnected)&&(ts=document.createElement("div"),ts.className="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))]",ts.setAttribute("aria-live","polite"),document.body.appendChild(ts));const a=e==="success"?Za.green:e==="error"?Za.red:Za.blue,n=document.createElement("div");n.setAttribute("role",e==="error"?"alert":"status"),n.className=`menu-panel rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl flex items-start gap-2 ${a}`,n.innerHTML=`<span class="flex-1 break-words">${m(t)}</span><button class="font-bold opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>`;const i=()=>n.remove();(r=n.querySelector("button"))==null||r.addEventListener("click",i),ts.appendChild(n),window.setTimeout(i,e==="error"?Math.max(s,7e3):s)}function yd(t){return new Promise(e=>{const s=document.createElement("div");s.className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md overflow-y-auto",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.innerHTML=`
      <div class="min-h-full flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
          <h3 class="text-lg font-extrabold text-white">${m(t.title)}</h3>
          <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${m(t.message)}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button data-act="cancel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs">Cancel</button>
            <button data-act="ok" class="px-4 py-2 rounded-xl ${t.danger?"bg-red-600 hover:bg-red-500":"bg-blue-600 hover:bg-blue-500"} text-white font-bold text-xs">${m(t.confirmLabel||"Confirm")}</button>
          </div>
        </div>
      </div>`;const a=i=>{document.removeEventListener("keydown",n,!0),s.remove(),e(i)},n=i=>{i.key==="Escape"&&(i.stopPropagation(),a(!1))};s.addEventListener("click",i=>{var o;const r=(o=i.target.closest("[data-act]"))==null?void 0:o.getAttribute("data-act");r==="ok"?a(!0):(r==="cancel"||i.target===s||i.target.parentElement===s)&&a(!1)}),document.addEventListener("keydown",n,!0),document.body.appendChild(s),s.querySelector('[data-act="ok"]').focus()}).catch(()=>!1)}function wd(t){var n;const e=document.createElement("div");e.className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md overflow-y-auto",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`
    <div class="min-h-full flex items-center justify-center p-4" data-backdrop>
      <div class="glass-panel w-full ${t.width||"max-w-md"} rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-extrabold text-white">${m(t.title)}</h3>
          <button data-close class="text-slate-400 hover:text-white font-bold" aria-label="Close">✕</button>
        </div>
        <div data-modal-body>${t.body}</div>
      </div>
    </div>`;const s=()=>{var i;document.removeEventListener("keydown",a),e.remove(),(i=t.onClose)==null||i.call(t)},a=i=>{i.key==="Escape"&&!document.querySelector('[role="dialog"].z-\\[110\\]')&&s()};return(n=e.querySelector("[data-close]"))==null||n.addEventListener("click",s),e.addEventListener("mousedown",i=>{i.target.hasAttribute("data-backdrop")&&s()}),document.addEventListener("keydown",a),document.body.appendChild(e),{root:e.querySelector("[data-modal-body]"),close:s}}function Sd(t,e=[10,25,50,100]){const s=t.total===0?0:(t.page-1)*t.pageSize+1,a=Math.min(t.total,t.page*t.pageSize),n=(i,r,o)=>`<button data-page="${r}" ${o?"disabled":""} class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed">${i}</button>`;return`
    <div class="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-400">
      <span>${t.total===0?"No results":`Showing <b class="text-slate-200">${s}–${a}</b> of <b class="text-slate-200">${t.total}</b>`}</span>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5">Rows
          <select data-page-size class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
            ${e.map(i=>`<option value="${i}" ${i===t.pageSize?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        ${n("« First",1,t.page<=1)}${n("‹ Prev",t.page-1,t.page<=1)}
        <span class="px-1">Page <b class="text-slate-200">${t.page}</b> / ${t.pages}</span>
        ${n("Next ›",t.page+1,t.page>=t.pages)}${n("Last »",t.pages,t.page>=t.pages)}
      </div>
    </div>`}function kd(t,e,s){var a;t.querySelectorAll("[data-page]").forEach(n=>n.addEventListener("click",()=>{n.disabled||e(Number(n.getAttribute("data-page")))})),(a=t.querySelector("[data-page-size]"))==null||a.addEventListener("change",n=>s(Number(n.currentTarget.value)))}function Yu(t,e=120){if(!t.length)return"";const a=Math.max(1,...t.map(c=>c.ok+c.bad)),n=600/t.length,i=Math.max(2,n*.7),r=(e-18)/a,o=t.map((c,u)=>{const f=u*n+(n-i)/2,p=c.ok*r,b=c.bad*r,g=e-16;return`<g><title>${m(c.label)}: ${c.ok} successful, ${c.bad} failed</title>
      ${c.ok?`<rect x="${f.toFixed(1)}" y="${(g-p).toFixed(1)}" width="${i.toFixed(1)}" height="${p.toFixed(1)}" rx="1.5" fill="#10b981"/>`:""}
      ${c.bad?`<rect x="${f.toFixed(1)}" y="${(g-p-b).toFixed(1)}" width="${i.toFixed(1)}" height="${b.toFixed(1)}" rx="1.5" fill="#ef4444"/>`:""}
      ${!c.ok&&!c.bad?`<rect x="${f.toFixed(1)}" y="${g-1}" width="${i.toFixed(1)}" height="1" fill="currentColor" opacity="0.2"/>`:""}
    </g>`}).join(""),l=Math.max(1,Math.ceil(t.length/6)),d=t.map((c,u)=>u%l===0?`<text x="${(u*n+n/2).toFixed(1)}" y="${e-3}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.55">${m(c.label)}</text>`:"").join("");return`<svg viewBox="0 0 600 ${e}" class="w-full text-slate-400" role="img" aria-label="Sign-ins over time" preserveAspectRatio="none">
    <line x1="0" y1="${e-16}" x2="600" y2="${e-16}" stroke="currentColor" opacity="0.2"/>${o}${d}</svg>`}function Ku(t,e){const s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download=e,a.style.display="none",document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(s),1e3)}function Xu(t){return navigator.clipboard.writeText(t).then(()=>!0,()=>!1)}const Zu={auth:"blue",staff:"purple",security:"red",settings:"amber",system:"slate",candidate:"green"},$o={password_ok:"Password accepted",login_success:"Signed in",login_failed:"Sign-in refused",login_blocked:"Tried while locked",otp_failed:"Wrong passcode",account_locked:"Account locked",logout:"Signed out",rate_limited:"Rate limited"},At={from:"",to:"",category:"",action:"",actor:"",success:"",search:"",order:"desc",page:1,pageSize:25},rs={from:"",to:"",email:"",portal:"",event:"",success:"",order:"desc",page:1,pageSize:25},X={tab:"trail",exporting:!1},et={data:null,error:"",loading:!1,open:new Set},ls={data:null,error:"",loading:!1};let Nt=null,ue=null;function ep(t){Object.assign(At,{from:"",to:"",category:"",action:"",actor:"",success:"",search:"",page:1},t),X.tab="trail",et.data=null}const Oe="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs",Fe=(t,e)=>`<label class="block"><span class="block text-[10px] font-bold uppercase text-slate-500 mb-1">${t}</span>${e}</label>`,Eo=t=>["","true","false"].map(e=>`<option value="${e}" ${t===e?"selected":""}>${e===""?"Any result":e==="true"?"Succeeded":"Failed / refused"}</option>`).join("");class tp{constructor(e){this.root=e}mount(){var e;ue=this,this.root.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Audit Logs</h2>
            <p class="text-xs text-slate-400 mt-0.5">An append-only record of who did what and from where. Entries cannot be edited or deleted.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-xl border border-slate-700 overflow-hidden" role="tablist">
              ${["trail","signins"].map(s=>`<button role="tab" aria-selected="${X.tab===s}" data-tab="${s}" class="px-3 py-2 text-xs font-bold ${X.tab===s?"bg-blue-600 text-white":"bg-slate-900 text-slate-400 hover:text-white"}">${s==="trail"?"Audit trail":"Sign-in history"}</button>`).join("")}
            </div>
            ${X.tab==="trail"?`<button id="au-export" ${X.exporting?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs disabled:opacity-60 whitespace-nowrap">${X.exporting?"Exporting…":"📥 Export CSV"}</button>`:""}
          </div>
        </div>
        <div id="au-filters"></div>
        <div id="au-table"></div>
        <div id="au-pager"></div>
      </div>`,this.root.querySelectorAll("[data-tab]").forEach(s=>s.addEventListener("click",()=>{X.tab=s.getAttribute("data-tab"),this.mount()})),(e=this.root.querySelector("#au-export"))==null||e.addEventListener("click",()=>void sp()),this.paintFilters(),this.paintTable(),X.tab==="trail"?(ws(),Nt||N.audit.meta().then(s=>{Nt=s,ue===this&&this.paintFilters()}).catch(()=>{})):Ss()}paintFilters(){var o;const e=this.root.querySelector("#au-filters");if(!e)return;const s=At,a=rs;e.innerHTML=X.tab==="trail"?`
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        ${Fe("From (UTC)",`<input data-f="from" type="date" value="${m(s.from)}" class="${Oe}" />`)}
        ${Fe("To (UTC)",`<input data-f="to" type="date" value="${m(s.to)}" class="${Oe}" />`)}
        ${Fe("Category",`<select data-f="category" class="${Oe}"><option value="">All</option>${((Nt==null?void 0:Nt.categories)||[]).map(l=>`<option value="${m(l)}" ${s.category===l?"selected":""}>${m(l)}</option>`).join("")}</select>`)}
        ${Fe("Action",`<select data-f="action" class="${Oe}"><option value="">All</option>${((Nt==null?void 0:Nt.actions)||[]).map(l=>`<option value="${m(l)}" ${s.action===l?"selected":""}>${m(l)}</option>`).join("")}</select>`)}
        ${Fe("Done by",`<input data-f="actor" type="search" value="${m(s.actor)}" placeholder="email" class="${Oe}" />`)}
        ${Fe("Result",`<select data-f="success" class="${Oe}">${Eo(s.success)}</select>`)}
        ${Fe("Search text",`<input data-f="search" type="search" value="${m(s.search)}" placeholder="words in the summary" class="${Oe}" />`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>`:`
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        ${Fe("From (UTC)",`<input data-f="from" type="date" value="${m(a.from)}" class="${Oe}" />`)}
        ${Fe("To (UTC)",`<input data-f="to" type="date" value="${m(a.to)}" class="${Oe}" />`)}
        ${Fe("Email",`<input data-f="email" type="search" value="${m(a.email)}" placeholder="contains…" class="${Oe}" />`)}
        ${Fe("Portal",`<select data-f="portal" class="${Oe}">${["","admin","recruiter","proctor"].map(l=>`<option value="${l}" ${a.portal===l?"selected":""}>${l||"All portals"}</option>`).join("")}</select>`)}
        ${Fe("Event",`<select data-f="event" class="${Oe}"><option value="">All events</option>${Object.entries($o).map(([l,d])=>`<option value="${l}" ${a.event===l?"selected":""}>${d}</option>`).join("")}</select>`)}
        ${Fe("Result",`<select data-f="success" class="${Oe}">${Eo(a.success)}</select>`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>`;const n=X.tab==="trail"?At:rs,i=()=>{n.page=1,X.tab==="trail"?ws():Ss()},r=gd(i,350);e.querySelectorAll("[data-f]").forEach(l=>{const d=l.getAttribute("data-f"),c=l instanceof HTMLInputElement&&l.type==="search";l.addEventListener(c?"input":"change",()=>{n[d]=l.value,(c?r:i)()})}),(o=e.querySelector("[data-clear]"))==null||o.addEventListener("click",()=>{X.tab==="trail"?Object.assign(At,{from:"",to:"",category:"",action:"",actor:"",success:"",search:"",page:1}):Object.assign(rs,{from:"",to:"",email:"",portal:"",event:"",success:"",page:1}),this.paintFilters(),i()})}paintTable(){var l,d,c,u;const e=this.root.querySelector("#au-table"),s=this.root.querySelector("#au-pager");if(!e||!s)return;const a=X.tab==="trail"?et:ls;if(!a.data){e.innerHTML=a.error?`<p class="text-xs text-red-400">${m(a.error)}</p><button id="au-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading…</p>',s.innerHTML="",(l=e.querySelector("#au-retry"))==null||l.addEventListener("click",()=>void(X.tab==="trail"?ws():Ss()));return}const n=a.loading?"opacity-60":"",i=a.error?`<p class="text-xs text-red-400 mb-2">${m(a.error)}</p>`:"",r=f=>`<button data-order class="uppercase font-semibold hover:text-white">When ${f==="desc"?"▼":"▲"}</button>`;if(X.tab==="trail"){const f=(((d=et.data)==null?void 0:d.items)||[]).map(p=>{const b=et.open.has(p.id);return`
          <tr class="hover:bg-slate-800/40 cursor-pointer align-top" data-row="${m(p.id)}" aria-expanded="${b}">
            <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${m(p.createdAt)}">${m(Ve(p.createdAt))}</td>
            <td class="py-2.5 px-3">${Me(p.category,Zu[p.category]||"slate")}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300 break-all">${m(p.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 break-all">${m(p.actorEmail||"system")}${p.actorRole?`<div class="text-[10px] text-slate-500">${m(p.actorRole)}</div>`:""}</td>
            <td class="py-2.5 px-3 text-slate-200 break-words min-w-[14rem]">${m(p.summary)}</td>
            <td class="py-2.5 px-3 text-center" title="${p.success?"Succeeded":"Failed / refused"}">${p.success?'<span class="text-emerald-400">✓</span>':'<span class="text-red-400">✗</span>'}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${m(p.ipAddress||"")}</td>
          </tr>
          ${b?`<tr class="bg-slate-900/60"><td colspan="7" class="px-5 py-3 text-[11px] text-slate-400 space-y-1.5">
            ${p.targetType?`<p><b class="text-slate-300">Target:</b> ${m(p.targetType)} <span class="font-mono">${m(p.targetId||"")}</span></p>`:""}
            <p><b class="text-slate-300">Browser:</b> ${m(ji(p.userAgent))}</p>
            ${p.details?`<div><b class="text-slate-300">Details:</b><pre class="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">${m(JSON.stringify(p.details,null,2))}</pre></div>`:""}
          </td></tr>`:""}`}).join("");e.innerHTML=`${i}<div class="overflow-x-auto ${n}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${r(At.order)}</th>${["Category","Action","Done by","What happened","OK","IP address"].map(p=>`<th class="py-2.5 px-3 uppercase font-semibold">${p}</th>`).join("")}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${f||'<tr><td colspan="7" class="py-10 text-center text-slate-500">No audit entries match these filters.</td></tr>'}</tbody></table></div>`,e.querySelectorAll("[data-row]").forEach(p=>p.addEventListener("click",()=>{const b=p.getAttribute("data-row");et.open.has(b)?et.open.delete(b):et.open.add(b),this.paintTable()}))}else{const f=(((c=ls.data)==null?void 0:c.items)||[]).map(p=>`
        <tr class="hover:bg-slate-800/40">
          <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${m(p.createdAt)}">${m(Ve(p.createdAt))}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">${m($o[p.event]||p.event)}</td>
          <td class="py-2.5 px-3">${p.success?Me("OK","green"):Me("Refused","red")}</td>
          <td class="py-2.5 px-3 text-slate-300 break-all">${m(p.email||"—")}</td>
          <td class="py-2.5 px-3 text-slate-400">${m(p.portal||"—")}</td>
          <td class="py-2.5 px-3 text-slate-400">${m((p.failureReason||"").replace(/_/g," "))}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${m(p.ipAddress||"")}</td>
          <td class="py-2.5 px-3 text-slate-500">${m(ji(p.userAgent))}</td>
        </tr>`).join("");e.innerHTML=`${i}<div class="overflow-x-auto ${n}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${r(rs.order)}</th>${["Event","Result","Email","Portal","Reason","IP address","Browser"].map(p=>`<th class="py-2.5 px-3 uppercase font-semibold">${p}</th>`).join("")}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${f||'<tr><td colspan="8" class="py-10 text-center text-slate-500">No sign-in events match these filters.</td></tr>'}</tbody></table></div>`}(u=e.querySelector("[data-order]"))==null||u.addEventListener("click",()=>{const f=X.tab==="trail"?At:rs;f.order=f.order==="desc"?"asc":"desc",f.page=1,X.tab==="trail"?ws():Ss()}),s.innerHTML=Sd(a.data);const o=X.tab==="trail"?At:rs;kd(s,f=>{o.page=f,X.tab==="trail"?ws():Ss()},f=>{o.pageSize=f,o.page=1,X.tab==="trail"?ws():Ss()})}}const rr=t=>Object.fromEntries(Object.entries(t).map(([e,s])=>[e,typeof s=="string"?s.trim():s]));async function ws(){et.loading=!0,ue==null||ue.paintTable();try{et.data=await N.audit.list(rr(At)),et.error=""}catch(t){et.error=Ge(t)}finally{et.loading=!1,X.tab==="trail"&&(ue==null||ue.paintTable())}}async function Ss(){ls.loading=!0,ue==null||ue.paintTable();try{ls.data=await N.audit.loginEvents(rr(rs)),ls.error=""}catch(t){ls.error=Ge(t)}finally{ls.loading=!1,X.tab==="signins"&&(ue==null||ue.paintTable())}}async function sp(){if(!X.exporting){X.exporting=!0,ue==null||ue.mount();try{const t=await N.audit.exportCsv(rr(At));Ku(t.blob,t.filename),ct(t.truncated?`Exported the first 50,000 entries as ${t.filename}. Narrow the filters to get the rest.`:`Exported ${t.filename}.`,t.truncated?"info":"success")}catch(t){ct(Ge(t),"error")}finally{X.exporting=!1,ue==null||ue.mount()}}}const qi=[{role:"Recruiter",label:"Recruiter / HR"},{role:"Proctor",label:"Live Proctor"},{role:"System Admin",label:"System Administrator"}],Ao={"System Admin":"purple",Recruiter:"blue",Proctor:"red"},ap={"System Admin":"/admin",Recruiter:"/recruiter",Proctor:"/proctor"},np=[["all","All accounts"],["active","Active"],["disabled","Disabled"],["locked","Locked out"],["pendingPassword","Awaiting new password"],["neverSignedIn","Never signed in"],["deleted","Deleted"]],ip={password_ok:"Password accepted",login_success:"Signed in",login_failed:"Wrong password / refused",login_blocked:"Tried while locked",otp_failed:"Wrong passcode",account_locked:"Account locked",logout:"Signed out",rate_limited:"Rate limited"},F={q:"",role:"",status:"all",department:"",sort:"createdAt",order:"desc",page:1,pageSize:25},Cs={data:null,error:"",loading:!1},L={id:null,detail:null,sessions:null,history:null,error:"",loading:!1,busy:!1,draft:{},role:""};let Z=null,To=!1;function rp(t){Object.assign(F,{q:"",role:"",status:"all",department:"",page:1},t),L.id=null}const op=t=>{var e;return!!t&&((e=x.getState().currentUser)==null?void 0:e.id)===t},$d=t=>!!t.lockedUntil&&new Date(t.lockedUntil).getTime()>Date.now();function Co(t){if(t.deletedAt)return Me("Deleted","slate");const e=[t.isActive===!1?Me("Disabled","slate"):Me("Active","green")];return $d(t)&&e.push(Me("Locked out","red")),t.isActive!==!1&&t.mustChangePassword&&e.push(Me("Awaiting new password","amber")),`<div class="flex flex-col items-start gap-1">${e.join("")}</div>`}class lp{constructor(e){this.root=e}mount(){var e;Z=this,this.root.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Staff Management</h2>
            <p class="text-xs text-slate-400 mt-0.5">Create accounts, change roles, reset passwords and end sessions. New people get a temporary password and must choose their own at first sign-in.</p>
          </div>
          <button id="st-add" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md transition-all whitespace-nowrap">＋ Add Staff Member</button>
        </div>
        ${this.toolbarHtml()}
        <div id="st-table"></div>
        <div id="st-pager"></div>
      </div>
      <div id="st-drawer"></div>`,this.bindToolbar(),(e=this.root.querySelector("#st-add"))==null||e.addEventListener("click",()=>up()),this.paintTable(),this.paintDrawer(),Gt(),L.id&&or(L.id,!1),To||(To=!0,document.addEventListener("keydown",s=>{s.key==="Escape"&&L.id&&!document.querySelector('[role="dialog"][aria-modal="true"]')&&ii()}))}toolbarHtml(){const e="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs";return`
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <input id="st-q" type="search" value="${m(F.q)}" placeholder="Search name, email or department" class="${e} md:col-span-4" aria-label="Search staff" />
        <select id="st-role" class="${e} md:col-span-2" aria-label="Filter by role">
          <option value="">All roles</option>${qi.map(s=>`<option value="${s.role}" ${F.role===s.role?"selected":""}>${s.role}</option>`).join("")}
        </select>
        <select id="st-status" class="${e} md:col-span-3" aria-label="Filter by status">
          ${np.map(([s,a])=>`<option value="${s}" ${F.status===s?"selected":""}>${a}</option>`).join("")}
        </select>
        <input id="st-dept" type="search" value="${m(F.department)}" placeholder="Department" class="${e} md:col-span-2" aria-label="Filter by department" />
        <button id="st-clear" class="md:col-span-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button>
      </div>`}bindToolbar(){const e=n=>this.root.querySelector(n),s=()=>{F.page=1,Gt()},a=gd(s,300);e("#st-q").addEventListener("input",n=>{F.q=n.target.value,a()}),e("#st-dept").addEventListener("input",n=>{F.department=n.target.value,a()}),e("#st-role").addEventListener("change",n=>{F.role=n.target.value,s()}),e("#st-status").addEventListener("change",n=>{F.status=n.target.value,s()}),e("#st-clear").addEventListener("click",()=>{Object.assign(F,{q:"",role:"",status:"all",department:"",page:1}),e("#st-q").value="",e("#st-dept").value="",e("#st-role").value="",e("#st-status").value="all",Gt()})}paintTable(){var d,c;const e=this.root.querySelector("#st-table"),s=this.root.querySelector("#st-pager");if(!e||!s)return;const{data:a,error:n,loading:i}=Cs;if(!a){e.innerHTML=n?`<p class="text-xs text-red-400">${m(n)}</p><button id="st-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading staff accounts…</p>',s.innerHTML="",(d=e.querySelector("#st-retry"))==null||d.addEventListener("click",()=>void Gt());return}const r=(c=x.getState().currentUser)==null?void 0:c.id,o=(u,f)=>{const p=F.sort===u;return`<th class="py-2.5 px-3"><button data-sort="${u}" class="uppercase font-semibold hover:text-white inline-flex items-center gap-1 ${p?"text-blue-400":""}">${f}<span aria-hidden="true">${p?F.order==="asc"?"▲":"▼":""}</span></button></th>`},l=a.items.map(u=>`
      <tr class="hover:bg-slate-800/40 cursor-pointer ${u.deletedAt||u.isActive===!1?"opacity-70":""}" data-open="${m(u.id)}">
        <td class="py-2.5 px-3"><div class="font-bold text-white">${m(u.name)}${u.id===r?' <span class="text-[10px] text-slate-500 font-normal">(you)</span>':""}</div>
          <div class="font-mono text-blue-400 text-[11px] break-all">${m(u.email)}</div>
          ${u.department?`<div class="text-[10px] text-slate-500">${m(u.department)}</div>`:""}</td>
        <td class="py-2.5 px-3">${Me(u.role,Ao[u.role]||"slate")}</td>
        <td class="py-2.5 px-3">${Co(u)}</td>
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap" title="${m(Ve(u.lastLoginAt))}">${m(_s(u.lastLoginAt))}</td>
        <td class="py-2.5 px-3 text-slate-300 text-center">${u.activeSessions}</td>
        <td class="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">${m(vd(u.createdAt))}</td>
        <td class="py-2.5 px-3 text-right"><button data-open-btn="${m(u.id)}" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px]">Manage</button></td>
      </tr>`).join("");e.innerHTML=`
      ${n?`<p class="text-xs text-red-400 mb-2">${m(n)}</p>`:""}
      <div class="overflow-x-auto ${i?"opacity-60":""}">
        <table class="w-full text-left text-xs">
          <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]">
            ${o("name","Person")}${o("role","Role")}<th class="py-2.5 px-3 uppercase font-semibold">Status</th>
            ${o("lastLoginAt","Last sign-in")}<th class="py-2.5 px-3 uppercase font-semibold text-center">Sessions</th>
            ${o("createdAt","Created")}<th class="py-2.5 px-3"></th>
          </tr></thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            ${l||'<tr><td colspan="7" class="py-10 px-3 text-center text-slate-500">No staff accounts match these filters.</td></tr>'}
          </tbody>
        </table>
      </div>`,s.innerHTML=Sd(a),e.querySelectorAll("[data-sort]").forEach(u=>u.addEventListener("click",()=>{const f=u.getAttribute("data-sort");F.order=F.sort===f&&F.order==="asc"?"desc":F.sort===f?"asc":f==="createdAt"||f==="lastLoginAt"?"desc":"asc",F.sort=f,F.page=1,Gt()})),e.querySelectorAll("[data-open]").forEach(u=>u.addEventListener("click",()=>void dp(u.getAttribute("data-open")))),kd(s,u=>{F.page=u,Gt()},u=>{F.pageSize=u,F.page=1,Gt()})}paintDrawer(){var r,o;const e=this.root.querySelector("#st-drawer");if(!e)return;if(!L.id){e.innerHTML="";return}const s=((r=e.querySelector("aside"))==null?void 0:r.scrollTop)??0,a=L.detail,n=a?this.drawerBody(a):`<p class="py-10 text-center text-xs ${L.error?"text-red-400":"text-slate-500 font-mono"}">${m(L.error||"Loading account…")}</p>`;e.innerHTML=`
      <div class="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" data-backdrop>
        <aside role="dialog" aria-label="Manage staff member" class="absolute right-0 top-0 h-full w-full max-w-xl menu-panel border-l border-slate-800 overflow-y-auto p-6 space-y-5 shadow-2xl">
          ${n}
        </aside>
      </div>`;const i=e.querySelector("aside");i.scrollTop=s,(o=e.querySelector("[data-backdrop]"))==null||o.addEventListener("mousedown",l=>{l.target===l.currentTarget&&ii()}),a&&this.bindDrawer(e,a)}drawerBody(e){var p;const s=op(e.id),a=!!e.deletedAt,n=L.busy?"disabled":"",i=(b,g)=>m(b in L.draft?L.draft[b]:g??""),r=(b,g,y,I,M={})=>`
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${b}">${g}</label>
        <input id="${b}" data-field="${y}" type="${M.type||"text"}" value="${i(y,I)}" ${M.disabled||a?"disabled":""} placeholder="${m(M.placeholder||"")}"
          class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white disabled:opacity-60" />
        ${M.hint?`<p class="text-[10px] text-slate-500 mt-1">${M.hint}</p>`:""}
      </div>`,o=(b,g,y="neutral",I="")=>`<button id="${b}" ${n} class="px-3 py-1.5 rounded-lg border font-bold text-[11px] disabled:opacity-50 ${y==="danger"?"bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300":y==="good"?"bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"} ${I}">${g}</button>`,l=(b,g,y="")=>`
      <section ${y?`id="${y}"`:""} class="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${b}</h4>${g}</section>`,d=(b,g)=>`<div><p class="text-[10px] uppercase font-bold text-slate-500">${b}</p><p class="text-xs text-slate-200 break-words">${g}</p></div>`,c=$d(e),u=L.sessions,f=((p=L.history)==null?void 0:p.items)||[];return`
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black shrink-0">${m((e.name||"?").trim().charAt(0).toUpperCase())}</div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-extrabold text-white break-words">${m(e.name)}${s?' <span class="text-xs text-slate-500 font-normal">(you)</span>':""}</h3>
          <p class="font-mono text-[11px] text-blue-400 break-all">${m(e.email)}</p>
          <div class="flex flex-wrap gap-1.5 mt-1.5">${Me(e.role,Ao[e.role]||"slate")}${Co(e).replace("flex flex-col items-start gap-1","flex flex-wrap gap-1.5")}</div>
        </div>
        <button id="dw-close" class="text-slate-400 hover:text-white font-bold text-lg leading-none" aria-label="Close">✕</button>
      </div>
      ${L.error?`<p class="text-xs font-semibold text-red-400 break-words">${m(L.error)}</p>`:""}

      ${l("Details",`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          ${r("dw-name","Full name","name",e.name)}
          ${r("dw-phone","Phone","phone",e.phone,{placeholder:"+91 98765 43210"})}
          ${r("dw-email","Login email","email",e.email,{disabled:s,type:"text"})}
          ${r("dw-otp","2FA email (passcodes go here)","otpEmail",e.otpEmail,{disabled:s,type:"text"})}
          <div class="sm:col-span-2">${r("dw-dept","Department","department",e.department)}</div>
        </div>
        ${s?'<p class="text-[10px] text-slate-500">You cannot change your own login or 2FA email (a typo could lock you out). Ask another System Admin.</p>':""}
        ${!s&&!a?'<p class="text-[10px] text-slate-500">Changing the login or 2FA email signs the person out everywhere and notifies their previous address.</p>':""}
        <div class="flex justify-end">${o("dw-save","Save changes","good",a?"hidden":"")}</div>`)}

      ${a?l("This account is deleted",`
        <p class="text-xs text-slate-300">Deleted ${m(Ve(e.deletedAt))}. It cannot sign in. Restoring brings it back <b>disabled</b>, and the person must set a new password.</p>
        <div>${o("dw-restore","↩ Restore account","good")}</div>`):`

      ${l("Access",`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-end">
          <div>
            <label class="block font-semibold text-slate-300 mb-1" for="dw-role">Role / portal</label>
            <select id="dw-role" ${s||L.busy?"disabled":""} class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold disabled:opacity-60">
              ${qi.map(b=>`<option value="${b.role}" ${(L.role||e.role)===b.role?"selected":""}>${b.label}</option>`).join("")}
            </select>
          </div>
          <div class="flex gap-2">${o("dw-role-apply","Change role","neutral",s||(L.role||e.role)===e.role?"hidden":"")}
            ${s?"":o("dw-toggle",e.isActive===!1?"Activate":"Deactivate",e.isActive===!1?"good":"danger")}</div>
        </div>
        ${s?'<p class="text-[10px] text-slate-500">You cannot change your own role or status.</p>':""}`)}

      ${l("Security",`
        <div class="grid grid-cols-2 gap-3">
          ${d("Last sign-in",e.lastLoginAt?`${m(Ve(e.lastLoginAt))} <span class="text-slate-500">(${m(_s(e.lastLoginAt))})</span>`:"Never")}
          ${d("Password changed",m(Ve(e.passwordChangedAt)))}
          ${d("Failed attempts",String(e.failedLogins))}
          ${d("Lockout",c?`<span class="text-red-400 font-semibold">until ${m(Ve(e.lockedUntil))}</span>`:"None")}
          ${d("Created",`${m(Ve(e.createdAt))}${e.createdByEmail?` by ${m(e.createdByEmail)}`:""}`)}
          ${d("Password status",e.mustChangePassword?'<span class="text-amber-400 font-semibold">Must choose a new password</span>':"Chosen by the user")}
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${c||e.failedLogins>0?o("dw-unlock","🔓 Unlock","good"):""}
          ${s?"":o("dw-reset","🔑 Reset password")}
          ${!s&&e.mustChangePassword&&e.isActive!==!1?o("dw-resend","✉ Resend credentials"):""}
          ${s?"":o("dw-logout","⏻ Force sign-out everywhere","danger")}
        </div>`)}

      ${l(`Active sessions${u?` (${u.length})`:""}`,u===null?'<p class="text-xs text-slate-500 font-mono">Loading…</p>':u.length===0?'<p class="text-xs text-slate-500">Not signed in anywhere.</p>':`<ul class="space-y-2">${u.map(b=>`
            <li class="flex items-center gap-3 rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <div class="min-w-0 flex-1 text-xs">
                <p class="font-semibold text-slate-200">${m(ji(b.userAgent))} <span class="font-mono text-slate-500 font-normal">${m(b.ipAddress||"")}</span></p>
                <p class="text-[10px] text-slate-500">Signed in ${m(Ve(b.startedAt))} • last active ${m(_s(b.lastActiveAt))} • expires ${m(Ve(b.expiresAt))}</p>
              </div>
              <button data-end-session="${m(b.id)}" ${n} class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-300 font-bold text-[11px] disabled:opacity-50">End</button>
            </li>`).join("")}</ul>`)}

      ${l("Recent sign-in activity",f.length===0?`<p class="text-xs text-slate-500">${L.history?"No sign-in activity recorded yet.":"Loading…"}</p>`:`<ul class="divide-y divide-slate-800/60">${f.map(b=>`
          <li class="py-1.5 flex items-center gap-2 text-[11px]">
            <span class="w-1.5 h-1.5 rounded-full ${b.success?"bg-emerald-500":"bg-red-500"}"></span>
            <span class="text-slate-200 font-semibold">${m(ip[b.event]||b.event)}</span>
            ${b.failureReason?`<span class="text-slate-500">(${m(b.failureReason.replace(/_/g," "))})</span>`:""}
            <span class="ml-auto text-slate-500 font-mono">${m(b.ipAddress||"")}</span>
            <span class="text-slate-500 whitespace-nowrap" title="${m(Ve(b.createdAt))}">${m(_s(b.createdAt))}</span>
          </li>`).join("")}</ul>`)}

      ${s?"":l("Danger zone",`
        <p class="text-xs text-slate-400">Deleting removes the account from lists and blocks sign-in at once. The history stays in the audit log and the account can be restored.</p>
        <div>${o("dw-delete","🗑 Delete account","danger")}</div>`)}`}`}bindDrawer(e,s){var n;const a=(i,r)=>{var o;return(o=e.querySelector(`#${i}`))==null?void 0:o.addEventListener("click",r)};a("dw-close",ii),e.querySelectorAll("input[data-field]").forEach(i=>i.addEventListener("input",()=>{L.draft[i.getAttribute("data-field")]=i.value})),(n=e.querySelector("#dw-role"))==null||n.addEventListener("change",i=>{L.role=i.target.value,this.paintDrawer()}),a("dw-save",()=>void cp(s)),a("dw-role-apply",()=>{const i=L.role||s.role;vt({title:"Change role?",confirmLabel:"Change role",danger:!0,message:`${s.name} will move from ${s.role} to ${i}. They are signed out everywhere and must use the ${i} portal.`},async()=>(await N.staff.setRole(s.id,i),L.role="",`${s.name} is now ${i}.`))}),a("dw-toggle",()=>{const i=s.isActive===!1;vt(i?null:{title:"Deactivate account?",confirmLabel:"Deactivate",danger:!0,message:`${s.name} is signed out immediately and cannot sign in until you activate the account again.`},async()=>(await N.staff.setActive(s.id,i),i?`${s.name} can sign in again.`:`${s.name} was deactivated.`))}),a("dw-unlock",()=>void vt(null,async()=>(await N.staff.unlock(s.id),`${s.name} was unlocked.`))),a("dw-reset",()=>void vt({title:"Reset password?",confirmLabel:"Reset password",danger:!0,message:`A new temporary password is created and emailed. ${s.name} is signed out everywhere and must choose their own password.`},async()=>(Di(await N.staff.resetPassword(s.id),"reset"),"Password reset."))),a("dw-resend",()=>void vt({title:"Resend credentials?",confirmLabel:"Send new password",message:`A new temporary password is created and emailed to ${s.name}. The previous temporary password stops working.`},async()=>(Di(await N.staff.resendCredentials(s.id),"resend"),"New credentials created."))),a("dw-logout",()=>void vt({title:"Sign out everywhere?",confirmLabel:"Force sign-out",danger:!0,message:`${s.name} is signed out of every device immediately. They can sign in again with their password.`},async()=>{const i=await N.staff.forceLogout(s.id);return`${i.message} (${i.revokedSessions} session${i.revokedSessions===1?"":"s"} ended)`})),a("dw-delete",()=>void vt({title:"Delete account?",confirmLabel:"Delete account",danger:!0,message:`${s.name} (${s.email}) is signed out now and can no longer sign in. You can restore the account later.`},async()=>(await N.staff.remove(s.id),`${s.name}'s account was deleted.`))),a("dw-restore",()=>void vt(null,async()=>(await N.staff.restore(s.id),`${s.name}'s account was restored (still disabled).`))),e.querySelectorAll("[data-end-session]").forEach(i=>i.addEventListener("click",()=>{const r=i.getAttribute("data-end-session");vt({title:"End this session?",confirmLabel:"End session",danger:!0,message:'That device can no longer refresh its sign-in. A screen already open stays usable until its access token expires (a few minutes); use "Force sign-out" to cut everything at once.'},async()=>(await N.staff.endSession(s.id,r),"Session ended."))}))}}async function Gt(){Cs.loading=!0,Z==null||Z.paintTable();try{const t={q:F.q.trim(),role:F.role,status:F.status,department:F.department.trim(),sort:F.sort,order:F.order,page:F.page,pageSize:F.pageSize};let e=await N.staff.search(t);e.items.length===0&&e.total>0&&F.page>e.pages&&(F.page=e.pages,e=await N.staff.search({...t,page:F.page})),Cs.data=e,Cs.error=""}catch(t){Cs.error=Ge(t)}finally{Cs.loading=!1,Z==null||Z.paintTable()}}async function dp(t){L.id=t,L.detail=null,L.sessions=null,L.history=null,L.error="",L.draft={},L.role="",await or(t,!0)}async function or(t,e){L.loading=!0,Z==null||Z.paintDrawer();const[s,a,n]=await Promise.allSettled([N.staff.detail(t),N.staff.sessions(t),N.audit.loginEvents({userId:t,pageSize:8})]);L.id===t&&(s.status==="fulfilled"?(L.detail=s.value,L.error="",e&&(L.draft={})):L.error=Ge(s.reason),L.sessions=a.status==="fulfilled"?a.value.items:[],L.history=n.status==="fulfilled"?n.value:null,L.loading=!1,Z==null||Z.paintDrawer())}function ii(){L.id=null,L.detail=null,Z==null||Z.paintDrawer()}async function vt(t,e){if(L.busy||!L.id||t&&!await yd(t))return;const s=L.id;L.busy=!0,L.error="",Z==null||Z.paintDrawer();try{ct(await e(),"success"),L.draft={}}catch(a){L.error=Ge(a),ct(Ge(a),"error")}finally{L.busy=!1}await Promise.all([or(s,!0),Gt()])}async function cp(t){const e={name:t.name,email:t.email,otpEmail:t.otpEmail,phone:t.phone||"",department:t.department||""},s={};if(Object.entries(L.draft).forEach(([n,i])=>{i.trim()!==e[n]&&(s[n]=i.trim())}),!Object.keys(s).length){ct("Nothing to save: no details were changed.","info",2500);return}if(s.name===""){L.error="The name must not be empty.",Z==null||Z.paintDrawer();return}const a="email"in s||"otpEmail"in s;await vt(a?{title:"Change sign-in email?",confirmLabel:"Save and sign out",danger:!0,message:`${t.name} is signed out everywhere, and their previous address is told about the change.`}:null,async()=>(await N.staff.updateProfile(t.id,s),"Details saved."))}function Di(t,e){var n,i;const a=wd({title:e==="created"?"Account created":e==="reset"?"Password reset":"New credentials",body:`
      <div class="space-y-3 text-xs">
        <p class="text-slate-300"><b class="text-white">${m(t.user.name)}</b> (${m(t.user.role)}) — <span class="font-mono text-blue-400">${m(t.user.email)}</span></p>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="cr-pass">Temporary password</label>
          <div class="flex gap-2">
            <input id="cr-pass" readonly value="${m(t.temporaryPassword)}" class="glass-input flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono text-sm tracking-wider" />
            <button id="cr-copy" class="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold">Copy</button>
          </div>
        </div>
        <p class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
          This is the only time the password is shown. ${t.emailed?"It has also been emailed.":"No email was sent: give it to them yourself."}
          They must choose a new password when they sign in at <b>${m(ap[t.user.role]||"/")}</b>.
        </p>
        <button id="cr-done" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider">DONE</button>
      </div>`});(n=a.root.querySelector("#cr-done"))==null||n.addEventListener("click",a.close),(i=a.root.querySelector("#cr-copy"))==null||i.addEventListener("click",async r=>{const o=r.currentTarget;await Xu(t.temporaryPassword)?o.textContent="Copied ✓":(a.root.querySelector("#cr-pass").select(),o.textContent="Press Ctrl+C")})}function up(t={},e=""){const s=(d,c="")=>m(t[d]??c),a="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white",n=wd({title:"Add staff member",body:`
      <p id="cs-error" class="text-xs font-semibold text-red-400 break-words ${e?"":"hidden"}">${m(e)}</p>
      <div class="space-y-3 text-xs">
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-name">Full name</label><input id="cs-name" class="${a}" value="${s("name")}" placeholder="Jane Doe" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-email">Work email (login id)</label><input id="cs-email" class="${a} font-mono" value="${s("email")}" placeholder="jane@company.com" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-role">Role</label>
          <select id="cs-role" class="${a} font-semibold">${qi.map(d=>`<option value="${d.role}" ${(t.role||"Recruiter")===d.role?"selected":""}>${d.label}</option>`).join("")}</select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-dept">Department <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-dept" class="${a}" value="${s("department")}" /></div>
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-phone">Phone <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-phone" class="${a}" value="${s("phone")}" placeholder="+91 98765 43210" /></div>
        </div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-otp">2FA email <span class="text-slate-500 font-normal">(optional — defaults to the work email)</span></label><input id="cs-otp" class="${a} font-mono" value="${s("otpEmail")}" /></div>
        <p class="text-[11px] text-slate-500">A temporary password is generated and emailed. They must replace it when they first sign in.</p>
        <button id="cs-submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 disabled:opacity-60">CREATE ACCOUNT ➔</button>
      </div>`}),i=d=>n.root.querySelector(d),r=i("#cs-submit"),o=d=>{const c=i("#cs-error");c.textContent=d,c.classList.toggle("hidden",!d)},l=async()=>{const d={name:i("#cs-name").value.trim(),email:i("#cs-email").value.trim(),role:i("#cs-role").value,department:i("#cs-dept").value.trim(),phone:i("#cs-phone").value.trim(),otpEmail:i("#cs-otp").value.trim()};if(!d.name||!d.email)return o("Enter a name and an email.");o(""),r.disabled=!0;try{const c=await N.staff.create({name:d.name,email:d.email,role:d.role,...d.department?{department:d.department}:{},...d.phone?{phone:d.phone}:{},...d.otpEmail?{otpEmail:d.otpEmail}:{}});n.close(),ct(`${c.user.name} was added.`,"success"),Di(c,"created"),Object.assign(F,{q:"",role:"",status:"all",department:"",sort:"createdAt",order:"desc",page:1}),Z==null||Z.mount()}catch(c){r.disabled=!1,o(Ge(c))}};r.addEventListener("click",()=>void l()),n.root.querySelectorAll("input").forEach(d=>d.addEventListener("keydown",c=>{c.key==="Enter"&&l()})),i("#cs-name").focus()}const ks=()=>({data:null,error:""}),Ke={staff:ks(),security:ks(),activity:ks(),invites:ks(),health:ks(),policy:ks()},pp={staff:()=>N.dashboard.staff(),security:()=>N.dashboard.security(we.hours),activity:()=>N.dashboard.activity(8),invites:()=>N.dashboard.invites(),health:()=>N.dashboard.health(),policy:()=>N.settings.group("proctoring")},we={hours:24,probing:!1,probe:null,refreshedAt:0};let ri;const hp={database:"Database",migrations:"Database schema",settings:"Platform settings",emailGateway:"Email gateway",encryption:"Secret encryption",securityPosture:"Security posture"},fp={healthy:{label:"Healthy",text:"text-emerald-400",tone:"green"},degraded:{label:"Needs attention",text:"text-amber-400",tone:"amber"},unhealthy:{label:"Unhealthy",text:"text-red-400",tone:"red"}},Lo={ok:"bg-emerald-500",warning:"bg-amber-500",error:"bg-red-500"},dt=(t,e="")=>`<div class="glass-panel p-5 rounded-2xl border border-slate-800 ${e}">${t}</div>`,bt=(t,e="")=>`<div class="flex items-center justify-between gap-3 mb-3"><h3 class="text-sm font-bold text-white">${t}</h3>${e}</div>`,Bt=(t,e)=>`<p class="text-xs text-red-400">${m(e)}</p>
   <button data-retry="${t}" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`,Et=(t="Loading…")=>`<p class="text-xs text-slate-500 font-mono">${t}</p>`;function Ht(t,e,s,a="text-white"){return dt(`
    <span class="text-xs font-semibold text-slate-400 uppercase">${t}</span>
    <div class="text-2xl font-extrabold ${a} mt-1">${e}</div>
    <div class="text-[11px] text-slate-500 mt-1 space-y-1">${s}</div>`)}function _o(t,e,s){if(t===0&&e===0)return"";const a=t-e;return a===0?'<span class="text-slate-500">same as before</span>':`<span class="${(s?a<0:a>0)?"text-emerald-400":"text-red-400"}">${a>0?"▲ +":"▼ −"}${Math.abs(a)} vs previous</span>`}class bp{constructor(e){this.root=e}mount(){var e;this.root.innerHTML=`
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-3">
          <p id="ov-refreshed" class="text-[11px] text-slate-500"></p>
          <button id="ov-refresh" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">⟳ Refresh</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div id="ov-tile-health"></div><div id="ov-tile-staff"></div><div id="ov-tile-policy"></div><div id="ov-tile-email"></div>
        </div>
        <div id="ov-security"></div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div id="ov-activity"></div>
          <div id="ov-health-details"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="ov-byrole"></div>
          <div id="ov-invites"></div>
        </div>
      </div>`,(e=this.root.querySelector("#ov-refresh"))==null||e.addEventListener("click",()=>this.loadAll(!0)),Object.keys(Ke).forEach(s=>this.paint(s)),this.paintRefreshed(),this.loadAll(),window.clearInterval(ri),ri=window.setInterval(()=>{if(!this.root.isConnected)return void window.clearInterval(ri);this.loadAll()},6e4)}loadAll(e=!1){const s=Object.keys(Ke).map(a=>this.load(a));Promise.all(s).then(()=>{we.refreshedAt=Date.now(),this.paintRefreshed(),e&&ct("Dashboard refreshed.","success",2e3)},()=>{}).catch(()=>{})}async load(e){try{Ke[e].data=await pp[e](),Ke[e].error=""}catch(s){Ke[e].error=Ge(s)}try{this.paint(e)}catch{}}paintRefreshed(){const e=this.root.querySelector("#ov-refreshed");e&&(e.textContent=we.refreshedAt?`Updated ${_s(new Date(we.refreshedAt).toISOString())} • refreshes every minute`:"")}put(e,s){const a=this.root.querySelector(e);return!a||!a.isConnected?null:(a.innerHTML=s,a)}paint(e){switch(e){case"health":this.paintHealth();break;case"staff":this.paintStaff();break;case"policy":this.paintPolicy();break;case"security":this.paintSecurity();break;case"activity":this.paintActivity();break;case"invites":this.paintInvites();break}this.root.querySelectorAll("[data-retry]").forEach(s=>{s.onclick=()=>{this.load(s.getAttribute("data-retry")).catch(()=>{})}}),this.root.querySelectorAll("[data-goto]").forEach(s=>{s.onclick=()=>this.navigate(s.getAttribute("data-goto"))})}navigate(e){const[s,a]=e.split(":");s==="staff"&&a&&rp({status:a});const n=s==="settings"&&a?a:"";$e.navigate(Tn("admin",s,n))}paintHealth(){var d;const{data:e,error:s}=Ke.health;if(!e){const c=s?Bt("health",s):Et();this.put("#ov-tile-health",Ht("System status",s?"Unknown":"…",c,"text-slate-400")),this.put("#ov-tile-email",Ht("Email gateway",s?"Unknown":"…",s?"":Et(),"text-slate-400")),this.put("#ov-health-details",dt(bt("Health checks")+(s?Bt("health",s):Et())));return}const a=fp[e.status];this.put("#ov-tile-health",Ht("System status",`<span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full ${Lo[e.status==="healthy"?"ok":e.status==="degraded"?"warning":"error"]} ${e.status==="healthy"?"animate-pulse":""}"></span>${a.label}</span>`,`<p>${m(e.environment)} • up ${Qu(e.uptimeSeconds)} • v${m(e.version)}</p>`,a.text));const n=e.components.find(c=>c.name==="emailGateway"),i=(n==null?void 0:n.details)||{},r=(n==null?void 0:n.status)==="ok",o=we.probe;this.put("#ov-tile-email",Ht("Email gateway",r?"Configured":"Not configured",`<p>${m(i.host||"—")}:${m(i.port||"")} • password: ${m(i.passwordSource||"none")}</p>
       <p>${m(i.sender||"no sender address")}</p>
       <button id="ov-probe" ${we.probing?"disabled":""} class="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-60">${we.probing?"Checking…":"🔌 Check connection"}</button>
       ${o?`<p class="${o.ok?"text-emerald-400":"text-red-400"} font-semibold break-words">${o.ok?"✓":"✗"} ${m(o.message)}</p>`:""}
       <button type="button" data-goto="settings:email" class="text-blue-400 hover:text-blue-300 font-semibold">Email settings →</button>`,r?"text-purple-400":"text-amber-400")),(d=this.root.querySelector("#ov-probe"))==null||d.addEventListener("click",()=>{this.probeEmail().catch(()=>{})});const l=e.components.map(c=>`
      <li class="py-2.5 border-b border-slate-800/60 last:border-0">
        <div class="flex items-start gap-2.5">
          <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${Lo[c.status]}"></span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-white">${m(hp[c.name]||c.name)}</p>
            <p class="text-[11px] text-slate-400 break-words">${m(c.message)}</p>
            ${(c.details.findings||[]).length?`<ul class="mt-1.5 space-y-1">${c.details.findings.map(u=>`<li class="text-[11px] text-amber-300/90 pl-3 relative before:content-['•'] before:absolute before:left-0">${m(u.message)}</li>`).join("")}</ul>`:""}
          </div>
          ${Me(c.status==="ok"?"OK":c.status==="warning"?"Check":"Problem",c.status==="ok"?"green":c.status==="warning"?"amber":"red")}
        </div>
      </li>`).join("");this.put("#ov-health-details",dt(bt("Health checks",Me(a.label,a.tone))+`<ul>${l}</ul>`))}async probeEmail(){if(!we.probing){we.probing=!0;try{this.paintHealth(),we.probe=await N.dashboard.probeEmail(),ct(we.probe.ok?"Email gateway connected.":we.probe.message,we.probe.ok?"success":"error")}catch(e){we.probe=null,ct(Ge(e),"error")}finally{we.probing=!1;try{this.paintHealth()}catch{}}}}paintStaff(){const{data:e,error:s}=Ke.staff;if(!e){this.put("#ov-tile-staff",Ht("Staff accounts",s?"Unavailable":"…",s?Bt("staff",s):Et(),"text-slate-400")),this.put("#ov-byrole",dt(bt("Staff by role")+(s?Bt("staff",s):Et())));return}const a=(i,r,o)=>i>0?`<button data-goto="staff:${o}" class="text-blue-400 hover:text-blue-300 font-semibold">${i} ${r}</button>`:`<span>${i} ${r}</span>`;this.put("#ov-tile-staff",Ht("Staff accounts",`${e.active} active`,`<p>${a(e.lockedNow,"locked","locked")} • ${a(e.pendingPasswordChange,"awaiting first password","pendingPassword")}</p>
       <p>${a(e.neverSignedIn,"never signed in","neverSignedIn")} • ${e.signedInLast24h} signed in today</p>`));const n=Math.max(1,...e.byRole.map(i=>i.active+i.disabled));this.put("#ov-byrole",dt(bt("Staff by role",'<button data-goto="staff" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">Manage →</button>')+`<div class="space-y-3">${e.byRole.map(i=>`
        <div>
          <div class="flex justify-between text-[11px] mb-1"><span class="font-bold text-slate-200">${m(i.role)}</span>
            <span class="text-slate-400">${i.active} active${i.disabled?` • ${i.disabled} disabled`:""}</span></div>
          <div class="h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div class="bg-blue-500" style="width:${i.active/n*100}%"></div>
            <div class="bg-slate-600" style="width:${i.disabled/n*100}%"></div>
          </div>
        </div>`).join("")}</div>
        <p class="text-[11px] text-slate-500 mt-3">${e.createdLast7d} created in the last 7 days • ${e.signedInLast7d} signed in this week</p>`))}paintPolicy(){const{data:e,error:s}=Ke.policy;if(!e){this.put("#ov-tile-policy",Ht("Proctoring policy",s?"Unavailable":"…",s?Bt("policy",s):Et(),"text-slate-400"));return}this.put("#ov-tile-policy",Ht("Proctoring policy",`${m(e.maxViolationsBeforeTerminate)} violations max`,`<p>${m(e.maxTabSwitches)} tab-switch warnings before action</p>
       <p>AI sensitivity: ${m(e.proctoringSensitivity)}</p>
       <button type="button" data-goto="settings:proctoring" class="text-blue-400 hover:text-blue-300 font-semibold">Edit policy →</button>`,"text-blue-400"))}paintSecurity(){const{data:e,error:s}=Ke.security,a=`<select id="ov-hours" class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
      ${[[24,"Last 24 hours"],[72,"Last 3 days"],[168,"Last 7 days"]].map(([l,d])=>`<option value="${l}" ${l===we.hours?"selected":""}>${d}</option>`).join("")}</select>`;if(!e){this.put("#ov-security",dt(bt("Sign-in security",a)+(s?Bt("security",s):Et()))),this.bindHours();return}const n=e.totals,i=(l,d,c="",u="text-white")=>`
      <div class="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <p class="text-[10px] font-bold uppercase text-slate-500">${l}</p>
        <p class="text-xl font-extrabold ${u}">${d}</p><p class="text-[10px] mt-0.5">${c||"&nbsp;"}</p>
      </div>`,r=(l,d)=>`
      <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">${l}</p>
        ${d.length?`<ul class="space-y-1">${d.map(c=>`<li class="flex justify-between gap-3 text-[11px]"><span class="font-mono text-slate-300 truncate">${m(c.value)}</span><span class="text-red-400 font-bold">${c.count}</span></li>`).join("")}</ul>`:'<p class="text-[11px] text-slate-500">None</p>'}</div>`,o=e.series.map(l=>({label:Ju(l.start,e.bucket),ok:l.successful,bad:l.failed}));this.put("#ov-security",dt(`
      ${bt("Sign-in security",a)}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${i("Successful sign-ins",n.successfulSignIns,_o(n.successfulSignIns,e.previousPeriod.successfulSignIns,!1),"text-emerald-400")}
        ${i("Failed sign-ins",n.failedSignIns,_o(n.failedSignIns,e.previousPeriod.failedSignIns,!0),n.failedSignIns?"text-red-400":"text-white")}
        ${i("Lockouts",n.lockouts,`${e.lockedAccountsNow} locked right now`,n.lockouts?"text-amber-400":"text-white")}
        ${i("Rate-limited",n.rateLimited,"blocked for too many requests",n.rateLimited?"text-amber-400":"text-white")}
        ${i("Wrong passcodes",n.otpFailures)}
        ${i("Blocked while locked",n.blockedAttempts)}
        ${i("People signed in",n.uniqueUsers)}
        ${i("Token-theft alerts",n.tokenReuseAlerts,n.tokenReuseAlerts?"investigate in Audit Logs":"",n.tokenReuseAlerts?"text-red-400":"text-white")}
      </div>
      <div class="mt-4">${Yu(o)}
        <div class="flex gap-4 text-[10px] text-slate-400 mt-1"><span><span class="inline-block w-2 h-2 rounded-sm bg-emerald-500"></span> successful</span><span><span class="inline-block w-2 h-2 rounded-sm bg-red-500"></span> failed / blocked</span>
          <span>per ${e.bucket} (UTC)</span></div></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-4 border-t border-slate-800">
        ${r("Top failing emails",e.topFailingEmails)}
        ${r("Top failing IP addresses",e.topFailingIps)}
        <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Why sign-ins failed</p>
          ${e.failuresByReason.length?`<div class="flex flex-wrap gap-1.5">${e.failuresByReason.map(l=>`<span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">${m(l.reason.replace(/_/g," "))} <b class="text-red-400">${l.count}</b></span>`).join("")}</div>`:'<p class="text-[11px] text-slate-500">None</p>'}</div>
      </div>
      ${e.truncated?'<p class="text-[10px] text-amber-400 mt-3">Very high volume: only the latest events were counted.</p>':""}`)),this.bindHours()}bindHours(){var e;(e=this.root.querySelector("#ov-hours"))==null||e.addEventListener("change",s=>{we.hours=Number(s.currentTarget.value),Ke.security.data=null,this.paintSecurity(),this.load("security").catch(()=>{})})}paintActivity(){const{data:e,error:s}=Ke.activity,a='<button data-goto="audit" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">View all →</button>';if(!e){this.put("#ov-activity",dt(bt("Recent activity",a)+(s?Bt("activity",s):Et())));return}const n={auth:"blue",staff:"purple",security:"red",settings:"amber",system:"slate",candidate:"green"};this.put("#ov-activity",dt(bt("Recent activity",a)+(e.items.length?`<ul>${e.items.map(i=>`
        <li class="py-2.5 border-b border-slate-800/60 last:border-0 flex items-start gap-2.5">
          <span class="mt-0.5">${i.success?"":"⚠️"}</span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-slate-200 break-words">${m(i.summary)}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">${_s(i.createdAt)}${i.actorEmail?` • ${m(i.actorEmail)}`:""}</p>
          </div>${Me(i.category,n[i.category]||"slate")}
        </li>`).join("")}</ul>`:'<p class="text-xs text-slate-500">Nothing has happened yet.</p>')))}paintInvites(){const{data:e,error:s}=Ke.invites;if(!e){this.put("#ov-invites",dt(bt("Candidate invitations")+(s?Bt("invites",s):Et())));return}const a=(n,i,r="text-white")=>`<div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><p class="text-[10px] font-bold uppercase text-slate-500">${n}</p><p class="text-xl font-extrabold ${r}">${i}</p></div>`;this.put("#ov-invites",dt(bt("Candidate invitations")+`
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${a("Total sent",e.total)}${a("Active",e.active,"text-blue-400")}${a("Waiting for candidate",e.awaitingCandidate,"text-amber-400")}
        ${a("Verified",e.verified,"text-emerald-400")}${a("Expired",e.expired)}${a("Expiring in 24 h",e.expiringWithin24h,e.expiringWithin24h?"text-amber-400":"text-white")}
      </div>
      <p class="text-[11px] text-slate-500 mt-3">${e.createdLast7d} sent in the last 7 days • ${e.revoked} revoked</p>`))}}const S={schema:null,values:{},drafts:{},fieldErrors:{},groupErrors:{},savedAt:{},saving:{},loadError:"",loading:!1,email:{busy:"",to:"",result:null}},mp=/^[^@\s<>"',;]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/,gp=/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/,xp=/[\u0000-\u001f\u007f<>"]/,pn=new Set(["smtpHost","smtpPort"]),vp={database:"A password is saved in the platform (encrypted).",environment:"Using the password from the server's .env file. Saving one here replaces it.",none:"No password is configured: emails cannot be sent."};let be=null;const Ed=(t,e)=>{var s;return(s=S.values[t])==null?void 0:s[e]},yp=(t,e)=>e in(S.drafts[t]||{})?S.drafts[t][e]:Ed(t,e);function en(t){var a,n;const e=S.drafts[t]||{};return(((n=(a=S.schema)==null?void 0:a.find(i=>i.group===t))==null?void 0:n.fields)||[]).filter(i=>pn.has(i.key)||!(i.key in e)?!1:i.secret?String(e[i.key]).length>0:e[i.key]!==Ed(t,i.key)).map(i=>i.key)}function wp(t,e){var a;if(t.type==="bool")return{value:!!e};if(t.type==="enum")return(a=t.choices)!=null&&a.includes(String(e))?{value:String(e)}:{error:"Choose one of the listed options."};if(t.type==="int"){const n=typeof e=="number"?e:Number(String(e).trim());return String(e).trim()===""||!Number.isInteger(n)?{error:"Enter a whole number."}:t.min!=null&&n<t.min?{error:`Must be at least ${t.min}.`}:t.max!=null&&n>t.max?{error:`Must be at most ${t.max}.`}:{value:n}}const s=t.secret?String(e??""):String(e??"").trim();return s?s.length>t.maxLength?{error:`At most ${t.maxLength} characters.`}:t.fmt==="email"&&!mp.test(s)?{error:"Enter a valid email address."}:t.fmt==="hostname"&&!gp.test(s)?{error:"Enter a host name such as smtp.gmail.com."}:t.fmt==="text"&&xp.test(s)?{error:'Remove special characters such as < > ".'}:{value:s}:t.allowEmpty?{value:""}:{error:"This cannot be empty."}}class Sp{constructor(e){this.root=e}mount(){be=this,this.paint(),Io()}paint(){var s,a;if(!this.root.isConnected)return;const e=window.scrollY;if(!S.schema){this.root.innerHTML=`<div class="glass-panel p-6 rounded-3xl border border-slate-800">${S.loadError?`<p class="text-xs text-red-400">${m(S.loadError)}</p><button id="se-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="text-xs text-slate-500 font-mono">Loading settings…</p>'}</div>`,(s=this.root.querySelector("#se-retry"))==null||s.addEventListener("click",()=>void Io());return}this.root.innerHTML=`
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Global Policy & System Settings</h2>
            <p class="text-xs text-slate-400 mt-0.5">Each section saves on its own and applies immediately. Every change is recorded in the audit log.</p>
          </div>
          <button id="se-history" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs whitespace-nowrap">📜 Settings history</button>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          ${S.schema.map(n=>`<div id="set-card-${n.group}" class="scroll-mt-24 ${n.group==="email"?"xl:col-span-2":""}">${this.cardHtml(n)}</div>`).join("")}
        </div>
      </div>`,(a=this.root.querySelector("#se-history"))==null||a.addEventListener("click",()=>{ep({category:"settings"}),$e.navigate(Tn("admin","audit"))}),S.schema.forEach(n=>this.bindCard(n)),window.location.hash?this.focusHash():window.scrollTo({top:e})}focusHash(){const e=window.location.hash.replace(/^#/,"");if(!e)return;const s=this.root.querySelector(`#set-card-${e}`)||this.root.querySelector(`#${e}`);s&&requestAnimationFrame(()=>{s.scrollIntoView({behavior:"smooth",block:"start"}),s.classList.add("ring-2","ring-blue-500/50"),window.setTimeout(()=>s.classList.remove("ring-2","ring-blue-500/50"),1800)})}paintCard(e){var n;const s=(n=S.schema)==null?void 0:n.find(i=>i.group===e),a=this.root.querySelector(`#set-card-${e}`);!s||!a||!a.isConnected||(a.innerHTML=this.cardHtml(s),this.bindCard(s))}cardHtml(e){const s=en(e.group).length,a=!!S.saving[e.group],n=e.fields.map(r=>this.fieldHtml(e.group,r)).join(""),i=e.fields.filter(r=>r.type==="bool").length>=3;return`
      <form data-group="${e.group}" novalidate class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 h-full">
        <div class="border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white">${m(e.title)}</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">${m(e.description)}</p>
        </div>
        <div class="${i||e.group==="email"?"grid grid-cols-1 md:grid-cols-2 gap-x-5":""} gap-y-4 space-y-4 md:space-y-0 text-xs">${n}</div>
        ${e.group==="email"?this.emailExtrasHtml():""}
        ${S.groupErrors[e.group]?`<p class="text-xs font-semibold text-red-400 break-words" role="alert">${m(S.groupErrors[e.group])}</p>`:""}
        <div class="flex items-center justify-end gap-3 pt-1">
          <span data-status class="mr-auto text-[11px] ${s?"text-amber-400":"text-slate-500"}">${s?`${s} unsaved change${s===1?"":"s"}`:S.savedAt[e.group]?`Saved ${m(Ve(S.savedAt[e.group]))}`:""}</span>
          <button type="button" data-discard ${s&&!a?"":"disabled"} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs disabled:opacity-40">Discard</button>
          <button type="submit" data-save ${s&&!a?"":"disabled"} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md disabled:opacity-40">${a?"SAVING…":"SAVE"}</button>
        </div>
      </form>`}fieldHtml(e,s){var f,p;const a=`set-${e}-${s.key}`,n=yp(e,s.key),i=(f=S.fieldErrors[e])==null?void 0:f[s.key],r=pn.has(s.key),o=s.type==="int"&&s.min!=null&&s.max!=null?` (${s.min}–${s.max})`:"",l=`<p data-error="${s.key}" class="text-[10px] text-red-400 mt-1 ${i?"":"hidden"}">${m(i||"")}</p>`,d=`glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white${r?" opacity-70 cursor-not-allowed":""}`,c=r?' readonly disabled tabindex="-1"':"";if(s.type==="bool")return`
        <label class="flex items-start justify-between gap-4 cursor-pointer py-1" for="${a}">
          <span><span class="block font-semibold text-slate-300">${m(s.label)}</span><span class="block text-[10px] text-slate-500">${m(s.description)}</span></span>
          <input id="${a}" data-key="${s.key}" type="checkbox" ${n?"checked":""} class="mt-1 w-4 h-4 shrink-0 text-blue-600 bg-slate-950 border-slate-700 rounded" />
        </label>`;let u;if(s.type==="enum")u=`<select id="${a}" data-key="${s.key}" class="${d} font-semibold">${(s.choices||[]).map(b=>`<option value="${m(b)}" ${String(n)===b?"selected":""}>${m(b)}</option>`).join("")}</select>`;else if(s.type==="int")u=`<input id="${a}" data-key="${s.key}" type="number" step="1" ${s.min!=null?`min="${s.min}"`:""} ${s.max!=null?`max="${s.max}"`:""} value="${m(n??"")}" class="${d}"${c} />`;else if(s.secret){const b=(p=S.values.email)==null?void 0:p.smtpPasswordSet;u=`<input id="${a}" data-key="${s.key}" type="password" autocomplete="new-password" value="${m(n??"")}" placeholder="${b?"•••••••• (leave empty to keep the current password)":"16-character app password"}" class="${d} font-mono" />`}else u=`<input id="${a}" data-key="${s.key}" type="${s.fmt==="email"?"email":"text"}" maxlength="${s.maxLength}" value="${m(n??"")}" class="${d} ${s.fmt?"font-mono":""}"${c} />`;return`
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${a}">${m(s.label)}</label>
        ${u}
        <p class="text-[10px] text-slate-500 mt-1">${m(s.description)}${o}${r?" Locked — this cannot be changed here.":""}</p>
        ${l}
      </div>`}emailExtrasHtml(){const s=(S.values.email||{}).smtpPasswordSource||"none",a=S.email.busy,n=en("email").length>0,i=S.email.result;return`
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          ${Me(s==="none"?"No password":s==="database"?"Password saved":"Password from .env",s==="none"?"amber":"green")}
          <span class="text-slate-400">${vp[s]}</span>
        </div>
        ${n?'<p class="text-[11px] text-amber-400">Save your email changes first: the checks below use the saved settings.</p>':""}
        <div class="flex flex-wrap items-end gap-2">
          <button type="button" data-email="probe" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-50">${a==="probe"?"Checking…":"🔌 Check connection"}</button>
          <div class="flex items-end gap-2">
            <input id="se-test-to" type="email" value="${m(S.email.to)}" placeholder="Send to (default: your 2FA email)" class="glass-input px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[11px] w-56" />
            <button type="button" data-email="test" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px] disabled:opacity-50">${a==="test"?"Sending…":"✉ Send test email"}</button>
          </div>
          ${s==="database"?`<button type="button" data-email="clear" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-[11px] disabled:opacity-50">Remove saved password</button>`:""}
        </div>
        ${i?`<p class="${i.ok?"text-emerald-400":"text-red-400"} font-semibold break-words" role="status">${i.ok?"✓":"✗"} ${m(i.text)}</p>`:""}
      </div>`}bindCard(e){var n;const s=this.root.querySelector(`form[data-group="${e.group}"]`);if(!s)return;const a=i=>e.fields.find(r=>r.key===i);if(s.querySelectorAll("[data-key]").forEach(i=>{const r=i.getAttribute("data-key");if(pn.has(r)||i.disabled)return;const o=()=>{var c,u,f;const l=a(r),d=l.type==="bool"?i.checked:l.type==="int"?i.value===""?"":Number(i.value):i.value;((c=S.drafts)[u=e.group]||(c[u]={}))[r]=d,S.fieldErrors[e.group]&&delete S.fieldErrors[e.group][r],(f=s.querySelector(`[data-error="${r}"]`))==null||f.classList.add("hidden"),S.groupErrors[e.group]="",this.refreshFooter(e.group,s)};i.addEventListener(i instanceof HTMLSelectElement||i.type==="checkbox"?"change":"input",o)}),s.addEventListener("submit",i=>{i.preventDefault(),kp(e)}),(n=s.querySelector("[data-discard]"))==null||n.addEventListener("click",()=>{S.drafts[e.group]={},S.fieldErrors[e.group]={},S.groupErrors[e.group]="",this.paintCard(e.group)}),e.group==="email"){const i=s.querySelector("#se-test-to");i==null||i.addEventListener("input",r=>{S.email.to=r.target.value}),i==null||i.addEventListener("keydown",r=>{r.key==="Enter"&&(r.preventDefault(),Mo("test"))}),s.querySelectorAll("[data-email]").forEach(r=>r.addEventListener("click",()=>void Mo(r.getAttribute("data-email"))))}}refreshFooter(e,s){const a=en(e).length;s.querySelectorAll("[data-save],[data-discard]").forEach(i=>{i.disabled=a===0||!!S.saving[e]});const n=s.querySelector("[data-status]");n&&(n.textContent=a?`${a} unsaved change${a===1?"":"s"}`:S.savedAt[e]?`Saved ${Ve(S.savedAt[e])}`:"",n.className=`mr-auto text-[11px] ${a?"text-amber-400":"text-slate-500"}`)}paintGroup(e){this.paintCard(e)}}async function Io(){S.loading=!0;try{const[t,e]=await Promise.all([N.settings.schema(),N.settings.all()]);S.schema=t.groups,S.values=e,S.loadError=""}catch(t){S.loadError=Ge(t)}finally{S.loading=!1,be==null||be.paint()}}async function kp(t){const e=en(t.group);if(!e.length||S.saving[t.group])return;const s={},a={};if(e.forEach(n=>{if(pn.has(n))return;const i=t.fields.find(o=>o.key===n),r=wp(i,S.drafts[t.group][n]);r.error?a[n]=r.error:s[n]=r.value}),S.fieldErrors[t.group]=a,Object.keys(a).length){S.groupErrors[t.group]="Fix the highlighted fields first.",be==null||be.paintGroup(t.group);return}S.saving[t.group]=!0,S.groupErrors[t.group]="",be==null||be.paintGroup(t.group);try{S.values[t.group]=await N.settings.update(t.group,s),S.drafts[t.group]={},S.savedAt[t.group]=new Date().toISOString(),ct(`${t.title} saved. It applies immediately.`,"success"),(t.group==="proctoring"||t.group==="assessment")&&x.loadPolicy("staff")}catch(n){S.groupErrors[t.group]=Ge(n)}finally{S.saving[t.group]=!1,be==null||be.paintGroup(t.group)}}async function Mo(t){if(!S.email.busy&&!(t==="clear"&&!await yd({title:"Remove the saved password?",confirmLabel:"Remove",danger:!0,message:"The platform will fall back to the password in the server's .env file (if there is one). Emails stop if there is none."}))){S.email.busy=t,S.email.result=null,be==null||be.paintGroup("email");try{if(t==="probe"){const e=await N.dashboard.probeEmail();S.email.result={ok:e.ok,text:e.message}}else if(t==="test"){const e=await N.settings.testEmail(S.email.to.trim()||void 0);S.email.result={ok:e.ok,text:e.ok?`Test email sent to ${e.sentTo} through ${e.host}:${e.port}.`:e.message}}else S.values.email=await N.settings.clearEmailPassword(),S.email.result={ok:!0,text:"The saved password was removed."},ct("Saved password removed.","success")}catch(e){S.email.result={ok:!1,text:Ge(e)}}finally{S.email.busy="",be==null||be.paintGroup("email")}}}const Po={overview:{icon:"📊",title:"Dashboard & Health",blurb:"How the platform is doing right now: accounts, sign-in security, activity and system health."},staff:{icon:"👥",title:"Staff Management",blurb:"Who can sign in, with which role, and what they can do."},settings:{icon:"⚙️",title:"Global System Settings",blurb:"Proctoring rules, assessment defaults, security policy and the email gateway."},audit:{icon:"📜",title:"Audit Logs",blurb:"Every sign-in and administrative action, with who did it and from where."}};class $p{constructor(e){h(this,"container");this.container=e}get activeTab(){const e=Sa("admin");return e in Po?e:"overview"}render(){const e=this.activeTab,s=Po[e];this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel border-slate-800">
          <div class="space-y-1">
            <h1 class="text-xl font-extrabold flex items-center gap-2.5">
              <span class="text-2xl">${s.icon}</span>
              <span>${s.title}</span>
            </h1>
            <p class="text-xs text-slate-400 max-w-2xl">${s.blurb}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Admin Console
            </span>
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Healthy
            </span>
          </div>
        </div>
        <div id="admin-tab-content"></div>
      </div>`;const a=this.container.querySelector("#admin-tab-content");switch(e){case"overview":new bp(a).mount();break;case"staff":new lp(a).mount();break;case"settings":new Sp(a).mount();break;case"audit":new tp(a).mount();break}}}const jo=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function Ep(t){return`${T.apiBase.replace(/^http/,"ws")}/ws/proctoring?token=${encodeURIComponent(t)}`}class Ap{constructor(){h(this,"root",null);h(this,"ws",null);h(this,"open",!1);h(this,"messages",[]);h(this,"speaking",!1);h(this,"poll",null);h(this,"audioCtx",null);h(this,"playAt",0);h(this,"publishTimer",null);h(this,"micBound",null);h(this,"micStop",null)}mount(){document.getElementById("candidate-assist")||(this.root=document.createElement("div"),this.root.id="candidate-assist",document.body.appendChild(this.root),this.paint()),this.connect(),this.watchGate()}hide(){var e;(e=this.root)==null||e.remove(),this.root=null}connect(){const e=T.getCandidateToken();!e||this.ws&&this.ws.readyState<=WebSocket.OPEN||(this.ws=new WebSocket(Ep(e)),this.ws.onopen=()=>this.startPublisher(),this.ws.onmessage=s=>{const a=JSON.parse(s.data);a.type==="history"&&Array.isArray(a.messages)?(this.messages=a.messages.map(n=>({from:n.from,text:n.text,at:n.at})),this.paint()):a.type==="chat"&&a.from==="proctor"?(this.messages.push({from:"proctor",text:a.text,at:a.at}),this.open=!0,this.speaking=!1,this.paint()):a.type==="audio"&&typeof a.pcm=="string"&&(this.speaking=!0,this.paint(),this.playPcm(a.pcm),window.setTimeout(()=>{this.speaking=!1,this.paint()},600))},this.ws.onclose=()=>{this.ws=null})}watchGate(){this.poll||(this.poll=window.setInterval(()=>{const e=x.getState();!e.otpVerified||e.examStarted||e.examCompleted||e.candidateFeedback||!e.systemCheckCompleted||!e.activeCandidateId||T.fetchJson("/candidate/gate","GET",void 0,"candidate").then(async s=>{const a=x.getState();if(!s.admitted||a.examStarted||a.examCompleted||a.candidateFeedback||!e.activeCandidateId)return;x.approveCandidateIdentity(e.activeCandidateId);const{requestExamFullscreen:n}=await _i(async()=>{const{requestExamFullscreen:i}=await Promise.resolve().then(()=>u0);return{requestExamFullscreen:i}},void 0);n()}).catch(()=>{})},2e3))}playPcm(e){const s=window.AudioContext||window.webkitAudioContext;if(!s)return;this.audioCtx||(this.audioCtx=new s({sampleRate:16e3}));const a=this.audioCtx;a.resume().catch(()=>{});const n=Uint8Array.from(atob(e),c=>c.charCodeAt(0)),i=new Int16Array(n.buffer,n.byteOffset,Math.floor(n.byteLength/2)),r=a.createBuffer(1,i.length,16e3),o=r.getChannelData(0);for(let c=0;c<i.length;c++)o[c]=i[c]/32768;const l=a.createBufferSource();l.buffer=r,l.connect(a.destination);const d=a.currentTime;this.playAt<d&&(this.playAt=d+.02),l.start(this.playAt),this.playAt+=r.duration}reportFinished(){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({type:"finished"}))}reportViolation(e,s="medium"){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({event:e,severity:s,timestamp:new Date().toISOString()}))}sendSnapshot(e,s){!this.ws||this.ws.readyState!==WebSocket.OPEN||!e.startsWith("data:image/jpeg")||e.length>4e5||this.ws.send(JSON.stringify({type:"snapshot",image:e,reason:s}))}startPublisher(){if(this.publishTimer)return;const e=document.createElement("canvas");e.width=320,e.height=180;const s=e.getContext("2d");this.publishTimer=window.setInterval(()=>{if(!this.ws||this.ws.readyState!==WebSocket.OPEN||!s)return;const a=["#proctor-pip-video","#stay-on-video","#wait-cam","#id-webcam"].map(r=>document.querySelector(r)).find(r=>r&&r.videoWidth>0&&!r.classList.contains("hidden"));if(!a)return;s.drawImage(a,0,0,e.width,e.height);const n=e.toDataURL("image/jpeg",.45);n.length<14e4&&this.ws.send(JSON.stringify({type:"frame",image:n}));const i=a.srcObject;i&&this.bindMic(i)},800)}bindMic(e){var o;if(this.micBound===e||!e.getAudioTracks().length)return;(o=this.micStop)==null||o.call(this);const s=window.AudioContext||window.webkitAudioContext;if(!s)return;const a=new s({sampleRate:16e3}),n=a.createMediaStreamSource(e),i=a.createScriptProcessor(2048,1,1),r=a.createGain();r.gain.value=0,i.onaudioprocess=l=>{if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return;const d=l.inputBuffer.getChannelData(0),c=new Int16Array(d.length);for(let p=0;p<d.length;p++){const b=Math.max(-1,Math.min(1,d[p]));c[p]=b<0?b*32768:b*32767}const u=new Uint8Array(c.buffer);let f="";for(let p=0;p<u.length;p++)f+=String.fromCharCode(u[p]);this.ws.send(JSON.stringify({type:"mic",pcm:btoa(f)}))},n.connect(i),i.connect(r),r.connect(a.destination),this.micBound=e,this.micStop=()=>{i.disconnect(),n.disconnect(),a.close().catch(()=>{}),this.micBound=null}}send(e){!this.ws||this.ws.readyState!==WebSocket.OPEN||(this.ws.send(JSON.stringify({type:"chat",text:e})),this.messages.push({from:"candidate",text:e,at:new Date().toISOString()}),this.paint(""))}paint(e){var a,n,i;if(!this.root)return;e===void 0&&(e=((a=this.root.querySelector("#cand-chat-input"))==null?void 0:a.value)||""),this.root.innerHTML=`
      <button id="cand-chat-toggle" class="fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xl shadow-lg shadow-blue-600/30" title="Chat with the proctor">💬</button>
      ${this.speaking?'<div class="fixed bottom-20 left-4 z-40 px-3 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">Proctor is speaking</div>':""}
      ${this.open?`
        <div class="fixed bottom-20 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          <div class="px-3 py-2 border-b border-slate-800 text-xs font-bold text-white">Proctor chat</div>
          <div id="cand-chat-log" class="h-56 overflow-y-auto p-3 space-y-2 text-xs">
            ${this.messages.map(r=>`
              <div class="${r.from==="candidate"?"text-right":"text-left"}">
                <span class="inline-block px-2.5 py-1.5 rounded-xl ${r.from==="candidate"?"bg-blue-600 text-white":"bg-slate-800 text-slate-100"}">${jo(r.text)}</span>
              </div>
            `).join("")||'<p class="text-slate-500">Message the proctor if you need help.</p>'}
          </div>
          <form id="cand-chat-form" class="flex gap-2 p-2 border-t border-slate-800">
            <input id="cand-chat-input" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Write a message" value="${jo(e)}" />
            <button class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold" type="submit">Send</button>
          </form>
        </div>
      `:""}
    `,(n=this.root.querySelector("#cand-chat-toggle"))==null||n.addEventListener("click",()=>{var r;this.open=!this.open,(r=this.audioCtx)==null||r.resume().catch(()=>{}),this.paint()}),(i=this.root.querySelector("#cand-chat-form"))==null||i.addEventListener("submit",r=>{var d;r.preventDefault();const o=(d=this.root)==null?void 0:d.querySelector("#cand-chat-input"),l=(o==null?void 0:o.value.trim())||"";l&&this.send(l)});const s=this.root.querySelector("#cand-chat-log");s&&(s.scrollTop=s.scrollHeight)}}const ba=new Ap,qo=Object.freeze(Object.defineProperty({__proto__:null,candidateAssist:ba},Symbol.toStringTag,{value:"Module"}));var ms=typeof self<"u"?self:{};function ss(){throw Error("Invalid UTF8")}function Do(t,e){return e=String.fromCharCode.apply(null,e),t==null?e:t+e}let Na,oi;const Tp=typeof TextDecoder<"u";let Cp;const Lp=typeof TextEncoder<"u";function Ad(t){if(Lp)t=(Cp||(Cp=new TextEncoder)).encode(t);else{let s=0;const a=new Uint8Array(3*t.length);for(let n=0;n<t.length;n++){var e=t.charCodeAt(n);if(e<128)a[s++]=e;else{if(e<2048)a[s++]=e>>6|192;else{if(e>=55296&&e<=57343){if(e<=56319&&n<t.length){const i=t.charCodeAt(++n);if(i>=56320&&i<=57343){e=1024*(e-55296)+i-56320+65536,a[s++]=e>>18|240,a[s++]=e>>12&63|128,a[s++]=e>>6&63|128,a[s++]=63&e|128;continue}n--}e=65533}a[s++]=e>>12|224,a[s++]=e>>6&63|128}a[s++]=63&e|128}}t=s===a.length?a:a.subarray(0,s)}return t}var lr,hn;e:{for(var Ro=["CLOSURE_FLAGS"],li=ms,di=0;di<Ro.length;di++)if((li=li[Ro[di]])==null){hn=null;break e}hn=li}var $a,Oo=hn&&hn[610401301];lr=Oo!=null&&Oo;const Fo=ms.navigator;function Ri(t){return!!lr&&!!$a&&$a.brands.some(({brand:e})=>e&&e.indexOf(t)!=-1)}function tt(t){var e;return(e=ms.navigator)&&(e=e.userAgent)||(e=""),e.indexOf(t)!=-1}function Wt(){return!!lr&&!!$a&&$a.brands.length>0}function ci(){return Wt()?Ri("Chromium"):(tt("Chrome")||tt("CriOS"))&&!(!Wt()&&tt("Edge"))||tt("Silk")}function dr(t){return dr[" "](t),t}$a=Fo&&Fo.userAgentData||null,dr[" "]=function(){};var _p=!Wt()&&(tt("Trident")||tt("MSIE"));!tt("Android")||ci(),ci(),tt("Safari")&&(ci()||!Wt()&&tt("Coast")||!Wt()&&tt("Opera")||!Wt()&&tt("Edge")||(Wt()?Ri("Microsoft Edge"):tt("Edg/"))||Wt()&&Ri("Opera"));var Td={},ua=null;function Ip(t){const e=t.length;let s=3*e/4;s%3?s=Math.floor(s):"=.".indexOf(t[e-1])!=-1&&(s="=.".indexOf(t[e-2])!=-1?s-2:s-1);const a=new Uint8Array(s);let n=0;return function(i,r){function o(d){for(;l<i.length;){const c=i.charAt(l++),u=ua[c];if(u!=null)return u;if(!/^[\s\xa0]*$/.test(c))throw Error("Unknown base64 encoding at char: "+c)}return d}Cd();let l=0;for(;;){const d=o(-1),c=o(0),u=o(64),f=o(64);if(f===64&&d===-1)break;r(d<<2|c>>4),u!=64&&(r(c<<4&240|u>>2),f!=64&&r(u<<6&192|f))}}(t,function(i){a[n++]=i}),n!==s?a.subarray(0,n):a}function Cd(){if(!ua){ua={};var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),e=["+/=","+/","-_=","-_.","-_"];for(let s=0;s<5;s++){const a=t.concat(e[s].split(""));Td[s]=a;for(let n=0;n<a.length;n++){const i=a[n];ua[i]===void 0&&(ua[i]=n)}}}}var Ld=typeof Uint8Array<"u",_d=!_p&&typeof btoa=="function";function No(t){if(!_d){var e;e===void 0&&(e=0),Cd(),e=Td[e];var s=Array(Math.floor(t.length/3)),a=e[64]||"";let l=0,d=0;for(;l<t.length-2;l+=3){var n=t[l],i=t[l+1],r=t[l+2],o=e[n>>2];n=e[(3&n)<<4|i>>4],i=e[(15&i)<<2|r>>6],r=e[63&r],s[d++]=o+n+i+r}switch(o=0,r=a,t.length-l){case 2:r=e[(15&(o=t[l+1]))<<2]||a;case 1:t=t[l],s[d]=e[t>>2]+e[(3&t)<<4|o>>4]+r+a}return s.join("")}for(e="",s=0,a=t.length-10240;s<a;)e+=String.fromCharCode.apply(null,t.subarray(s,s+=10240));return e+=String.fromCharCode.apply(null,s?t.subarray(s):t),btoa(e)}const Bo=/[-_.]/g,Mp={"-":"+",_:"/",".":"="};function Pp(t){return Mp[t]||""}function Id(t){if(!_d)return Ip(t);Bo.test(t)&&(t=t.replace(Bo,Pp)),t=atob(t);const e=new Uint8Array(t.length);for(let s=0;s<t.length;s++)e[s]=t.charCodeAt(s);return e}function La(t){return Ld&&t!=null&&t instanceof Uint8Array}var Fs={};function gs(){return jp||(jp=new It(null,Fs))}function cr(t){Md(Fs);var e=t.g;return(e=e==null||La(e)?e:typeof e=="string"?Id(e):null)==null?e:t.g=e}var It=class{h(){return new Uint8Array(cr(this)||0)}constructor(t,e){if(Md(e),this.g=t,t!=null&&t.length===0)throw Error("ByteString should be constructed with non-empty values")}};let jp,qp;function Md(t){if(t!==Fs)throw Error("illegal external caller")}function Pd(t,e){t.__closure__error__context__984382||(t.__closure__error__context__984382={}),t.__closure__error__context__984382.severity=e}function Oi(t){return Pd(t=Error(t),"warning"),t}var Cn=typeof Symbol=="function"&&typeof Symbol()=="symbol",Dp=new Set;function _a(t,e,s=!1,a=!1){return t=typeof Symbol=="function"&&typeof Symbol()=="symbol"?a&&Symbol.for&&t?Symbol.for(t):t!=null?Symbol(t):Symbol():e,s&&Dp.add(t),t}var Rp=_a("jas",void 0,!0,!0),Ho=_a(void 0,"0di"),ui=_a(void 0,"2ex"),ia=_a(void 0,"1oa",!0),Ns=_a(void 0,Symbol(),!0);const A=Cn?Rp:"Ga",jd={Ga:{value:0,configurable:!0,writable:!0,enumerable:!1}},qd=Object.defineProperties;function Ln(t,e){Cn||A in t||qd(t,jd),t[A]|=e}function pe(t,e){Cn||A in t||qd(t,jd),t[A]=e}function Ys(t){return Ln(t,34),t}function Op(t,e){pe(e,-30975&(0|t))}function Fi(t,e){pe(e,-30941&(34|t))}function ur(){return typeof BigInt=="function"}function Pe(t){return Array.prototype.slice.call(t)}var pr,Ia={},Dd={};function Uo(t){return!(!t||typeof t!="object"||t.Ia!==Dd)}function hr(t){return t!==null&&typeof t=="object"&&!Array.isArray(t)&&t.constructor===Object}function fr(t,e){if(t!=null){if(typeof t=="string")t=t?new It(t,Fs):gs();else if(t.constructor!==It)if(La(t))t=t.length?new It(new Uint8Array(t),Fs):gs();else{if(!e)throw Error();t=void 0}}return t}function fn(t){return!(!Array.isArray(t)||t.length)&&!!(1&(0|t[A]))}const Vo=[];function Xt(t){if(2&t)throw Error()}pe(Vo,55),pr=Object.freeze(Vo);class bn{constructor(e,s,a){this.l=0,this.g=e,this.h=s,this.m=a}next(){if(this.l<this.g.length){const e=this.g[this.l++];return{done:!1,value:this.h?this.h.call(this.m,e):e}}return{done:!0,value:void 0}}[Symbol.iterator](){return new bn(this.g,this.h,this.m)}}function br(t){return Ns?t[Ns]:void 0}var Fp=Object.freeze({});function _n(t){return t.Qa=!0,t}var Np=_n(t=>typeof t=="number"),Go=_n(t=>typeof t=="string"),Bp=_n(t=>typeof t=="boolean"),In=typeof ms.BigInt=="function"&&typeof ms.BigInt(0)=="bigint",Ni=_n(t=>In?t>=Up&&t<=Gp:t[0]==="-"?Wo(t,Hp):Wo(t,Vp));const Hp=Number.MIN_SAFE_INTEGER.toString(),Up=In?BigInt(Number.MIN_SAFE_INTEGER):void 0,Vp=Number.MAX_SAFE_INTEGER.toString(),Gp=In?BigInt(Number.MAX_SAFE_INTEGER):void 0;function Wo(t,e){if(t.length>e.length)return!1;if(t.length<e.length||t===e)return!0;for(let s=0;s<t.length;s++){const a=t[s],n=e[s];if(a>n)return!1;if(a<n)return!0}}const Wp=typeof Uint8Array.prototype.slice=="function";let Rd,J=0,oe=0;function zo(t){const e=t>>>0;J=e,oe=(t-e)/4294967296>>>0}function Bs(t){if(t<0){zo(-t);const[e,s]=vr(J,oe);J=e>>>0,oe=s>>>0}else zo(t)}function mr(t){const e=Rd||(Rd=new DataView(new ArrayBuffer(8)));e.setFloat32(0,+t,!0),oe=0,J=e.getUint32(0,!0)}function gr(t,e){const s=4294967296*e+(t>>>0);return Number.isSafeInteger(s)?s:Ea(t,e)}function xr(t,e){const s=2147483648&e;return s&&(e=~e>>>0,(t=1+~t>>>0)==0&&(e=e+1>>>0)),typeof(t=gr(t,e))=="number"?s?-t:t:s?"-"+t:t}function Ea(t,e){if(t>>>=0,(e>>>=0)<=2097151)var s=""+(4294967296*e+t);else ur()?s=""+(BigInt(e)<<BigInt(32)|BigInt(t)):(t=(16777215&t)+6777216*(s=16777215&(t>>>24|e<<8))+6710656*(e=e>>16&65535),s+=8147497*e,e*=2,t>=1e7&&(s+=t/1e7>>>0,t%=1e7),s>=1e7&&(e+=s/1e7>>>0,s%=1e7),s=e+Jo(s)+Jo(t));return s}function Jo(t){return t=String(t),"0000000".slice(t.length)+t}function Mn(t){if(t.length<16)Bs(Number(t));else if(ur())t=BigInt(t),J=Number(t&BigInt(4294967295))>>>0,oe=Number(t>>BigInt(32)&BigInt(4294967295));else{const e=+(t[0]==="-");oe=J=0;const s=t.length;for(let a=e,n=(s-e)%6+e;n<=s;a=n,n+=6){const i=Number(t.slice(a,n));oe*=1e6,J=1e6*J+i,J>=4294967296&&(oe+=Math.trunc(J/4294967296),oe>>>=0,J>>>=0)}if(e){const[a,n]=vr(J,oe);J=a,oe=n}}}function vr(t,e){return e=~e,t?t=1+~t:e+=1,[t,e]}const yr=typeof BigInt=="function"?BigInt.asIntN:void 0,zp=typeof BigInt=="function"?BigInt.asUintN:void 0,Ms=Number.isSafeInteger,Pn=Number.isFinite,mn=Math.trunc;function Zt(t){return t==null||typeof t=="number"?t:t==="NaN"||t==="Infinity"||t==="-Infinity"?Number(t):void 0}function Od(t){return t==null||typeof t=="boolean"?t:typeof t=="number"?!!t:void 0}const Jp=/^-?([1-9][0-9]*|0)(\.[0-9]+)?$/;function jn(t){switch(typeof t){case"bigint":return!0;case"number":return Pn(t);case"string":return Jp.test(t);default:return!1}}function Ks(t){if(t==null)return t;if(typeof t=="string"&&t)t=+t;else if(typeof t!="number")return;return Pn(t)?0|t:void 0}function Fd(t){if(t==null)return t;if(typeof t=="string"&&t)t=+t;else if(typeof t!="number")return;return Pn(t)?t>>>0:void 0}function Qo(t){if(t[0]==="-")return!1;const e=t.length;return e<20||e===20&&Number(t.substring(0,6))<184467}function wr(t){return t=mn(t),Ms(t)||(Bs(t),t=xr(J,oe)),t}function Sr(t){var e=mn(Number(t));if(Ms(e))return String(e);if((e=t.indexOf("."))!==-1&&(t=t.substring(0,e)),e=t.length,!(t[0]==="-"?e<20||e===20&&Number(t.substring(0,7))>-922337:e<19||e===19&&Number(t.substring(0,6))<922337))if(Mn(t),t=J,2147483648&(e=oe))if(ur())t=""+(BigInt(0|e)<<BigInt(32)|BigInt(t>>>0));else{const[s,a]=vr(t,e);t="-"+Ea(s,a)}else t=Ea(t,e);return t}function gn(t){return t==null?t:typeof t=="bigint"?(Ni(t)?t=Number(t):(t=yr(64,t),t=Ni(t)?Number(t):String(t)),t):jn(t)?typeof t=="number"?wr(t):Sr(t):void 0}function Qp(t){if(t==null)return t;var e=typeof t;if(e==="bigint")return String(zp(64,t));if(jn(t)){if(e==="string")return e=mn(Number(t)),Ms(e)&&e>=0?t=String(e):((e=t.indexOf("."))!==-1&&(t=t.substring(0,e)),Qo(t)||(Mn(t),t=Ea(J,oe))),t;if(e==="number")return(t=mn(t))>=0&&Ms(t)?t:function(s){if(s<0){Bs(s);var a=Ea(J,oe);return s=Number(a),Ms(s)?s:a}return Qo(a=String(s))?a:(Bs(s),gr(J,oe))}(t)}}function Nd(t){if(typeof t!="string")throw Error();return t}function Xs(t){if(t!=null&&typeof t!="string")throw Error();return t}function Hs(t){return t==null||typeof t=="string"?t:void 0}function kr(t,e,s,a){if(t!=null&&typeof t=="object"&&t.W===Ia)return t;if(!Array.isArray(t))return s?2&a?((t=e[Ho])||(Ys((t=new e).u),t=e[Ho]=t),e=t):e=new e:e=void 0,e;let n=s=0|t[A];return n===0&&(n|=32&a),n|=2&a,n!==s&&pe(t,n),new e(t)}function Yp(t,e,s){if(e)e:{if(!jn(e=t))throw Oi("int64");switch(typeof e){case"string":e=Sr(e);break e;case"bigint":if(t=e=yr(64,e),Go(t)){if(!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(t))throw Error(String(t))}else if(Np(t)&&!Number.isSafeInteger(t))throw Error(String(t));e=In?BigInt(e):Bp(e)?e?"1":"0":Go(e)?e.trim()||"0":String(e);break e;default:e=wr(e)}}else e=gn(t);return typeof(s=(t=e)==null?s?0:void 0:t)=="string"&&Ms(e=+s)?e:s}const Kp={};let Xp=function(){try{return dr(new class extends Map{constructor(){super()}}),!1}catch{return!0}}();class pi{constructor(){this.g=new Map}get(e){return this.g.get(e)}set(e,s){return this.g.set(e,s),this.size=this.g.size,this}delete(e){return e=this.g.delete(e),this.size=this.g.size,e}clear(){this.g.clear(),this.size=this.g.size}has(e){return this.g.has(e)}entries(){return this.g.entries()}keys(){return this.g.keys()}values(){return this.g.values()}forEach(e,s){return this.g.forEach(e,s)}[Symbol.iterator](){return this.entries()}}const Zp=Xp?(Object.setPrototypeOf(pi.prototype,Map.prototype),Object.defineProperties(pi.prototype,{size:{value:0,configurable:!0,enumerable:!0,writable:!0}}),pi):class extends Map{constructor(){super()}};function Yo(t){return t}function hi(t){if(2&t.L)throw Error("Cannot mutate an immutable Map")}var at=class extends Zp{constructor(t,e,s=Yo,a=Yo){super();let n=0|t[A];n|=64,pe(t,n),this.L=n,this.S=e,this.R=s,this.Y=this.S?eh:a;for(let i=0;i<t.length;i++){const r=t[i],o=s(r[0],!1,!0);let l=r[1];e?l===void 0&&(l=null):l=a(r[1],!1,!0,void 0,void 0,n),super.set(o,l)}}na(t=Ko){if(this.size!==0)return this.X(t)}X(t=Ko){const e=[],s=super.entries();for(var a;!(a=s.next()).done;)(a=a.value)[0]=t(a[0]),a[1]=t(a[1]),e.push(a);return e}clear(){hi(this),super.clear()}delete(t){return hi(this),super.delete(this.R(t,!0,!1))}entries(){var t=this.ma();return new bn(t,th,this)}keys(){return this.Ha()}values(){var t=this.ma();return new bn(t,at.prototype.get,this)}forEach(t,e){super.forEach((s,a)=>{t.call(e,this.get(a),a,this)})}set(t,e){return hi(this),(t=this.R(t,!0,!1))==null?this:e==null?(super.delete(t),this):super.set(t,this.Y(e,!0,!0,this.S,!1,this.L))}Na(t){const e=this.R(t[0],!1,!0);t=t[1],t=this.S?t===void 0?null:t:this.Y(t,!1,!0,void 0,!1,this.L),super.set(e,t)}has(t){return super.has(this.R(t,!1,!1))}get(t){t=this.R(t,!1,!1);const e=super.get(t);if(e!==void 0){var s=this.S;return s?((s=this.Y(e,!1,!0,s,this.ra,this.L))!==e&&super.set(t,s),s):e}}ma(){return Array.from(super.keys())}Ha(){return super.keys()}[Symbol.iterator](){return this.entries()}};function eh(t,e,s,a,n,i){return t=kr(t,a,s,i),n&&(t=Dn(t)),t}function Ko(t){return t}function th(t){return[t,this.get(t)]}let sh,Bd,ah;function Xo(){return sh||(sh=new at(Ys([]),void 0,void 0,void 0,Kp))}function $r(t,e,s,a,n){if(t!=null){if(Array.isArray(t))t=fn(t)?void 0:n&&2&(0|t[A])?t:Er(t,e,s,a!==void 0,n);else if(hr(t)){const i={};for(let r in t)i[r]=$r(t[r],e,s,a,n);t=i}else t=e(t,a);return t}}function Er(t,e,s,a,n){const i=a||s?0|t[A]:0,r=a?!!(32&i):void 0;a=Pe(t);for(let o=0;o<a.length;o++)a[o]=$r(a[o],e,s,r,n);return s&&((t=br(t))&&(a[Ns]=Pe(t)),s(i,a)),a}function nh(t){return $r(t,Hd,void 0,void 0,!1)}function Hd(t){return t.W===Ia?t.toJSON():t instanceof at?t.na(nh):function(e){switch(typeof e){case"number":return isFinite(e)?e:String(e);case"bigint":return Ni(e)?Number(e):String(e);case"boolean":return e?1:0;case"object":if(e)if(Array.isArray(e)){if(fn(e))return}else{if(La(e))return No(e);if(e instanceof It){const s=e.g;return s==null?"":typeof s=="string"?s:e.g=No(s)}if(e instanceof at)return e.na()}}return e}(t)}function Ud(t){return Er(t,Hd,void 0,void 0,!1)}function Jt(t,e,s){return t=Vd(t,e[0],e[1],s?1:2),e!==Bd&&s&&Ln(t,16384),t}function Vd(t,e,s,a){if(t==null){var n=96;s?(t=[s],n|=512):t=[],e&&(n=-33521665&n|(1023&e)<<15)}else{if(!Array.isArray(t))throw Error("narr");if(2048&(n=0|t[A]))throw Error("farr");if(64&n)return t;if(a===1||a===2||(n|=64),s&&(n|=512,s!==t[0]))throw Error("mid");e:{if(a=(s=t).length){const i=a-1;if(hr(s[i])){if((e=i-(512&(n|=256)?0:-1))>=1024)throw Error("pvtlmt");n=-33521665&n|(1023&e)<<15;break e}}if(e){if((e=Math.max(e,a-(512&n?0:-1)))>1024)throw Error("spvt");n=-33521665&n|(1023&e)<<15}}}return pe(t,n),t}function Bi(t,e,s=Fi){if(t!=null){if(Ld&&t instanceof Uint8Array)return e?t:new Uint8Array(t);if(Array.isArray(t)){var a=0|t[A];return 2&a?t:(e&&(e=a===0||!!(32&a)&&!(64&a||!(16&a))),e?(pe(t,-12293&(34|a)),t):Er(t,Bi,4&a?Fi:s,!0,!0))}return t.W===Ia?t=2&(a=0|(s=t.u)[A])?t:new t.constructor(qn(s,a,!0)):t instanceof at&&!(2&t.L)&&(s=Ys(t.X(Bi)),t=new at(s,t.S,t.R,t.Y)),t}}function qn(t,e,s){const a=s||2&e?Fi:Op,n=!!(32&e);return t=function(i,r,o){const l=Pe(i);var d=l.length;const c=256&r?l[d-1]:void 0;for(d+=c?-1:0,r=512&r?1:0;r<d;r++)l[r]=o(l[r]);if(c){r=l[r]={};for(const u in c)r[u]=o(c[u])}return(i=br(i))&&(l[Ns]=Pe(i)),l}(t,e,i=>Bi(i,n,a)),Ln(t,32|(s?2:0)),t}function Dn(t){const e=t.u,s=0|e[A];return 2&s?new t.constructor(qn(e,s,!1)):t}function Us(t,e){return Rt(t=t.u,0|t[A],e)}function Rt(t,e,s,a){if(s===-1)return null;var n=s+(512&e?0:-1);const i=t.length-1;return n>=i&&256&e?t[i][s]:a&&256&e&&(e=t[i][s])!=null?(t[n]!=null&&ui!=null&&((n=(t=qp??(qp={}))[ui]||0)>=4||(t[ui]=n+1,Pd(t=Error(),"incident"),function(r){ms.setTimeout(()=>{throw r},0)}(t))),e):n<=i?t[n]:void 0}function Q(t,e,s){const a=t.u;let n=0|a[A];return Xt(n),ie(a,n,e,s),t}function ie(t,e,s,a){const n=512&e?0:-1,i=s+n;var r=t.length-1;return i>=r&&256&e?(t[r][s]=a,e):i<=r?(t[i]=a,256&e&&s in(t=t[r])&&delete t[s],e):(a!==void 0&&(s>=(r=e>>15&1023||536870912)?a!=null&&(t[r+n]={[s]:a},pe(t,e|=256)):t[i]=a),e)}function tn(t,e){let s=0|(t=t.u)[A];const a=Rt(t,s,e),n=Zt(a);return n!=null&&n!==a&&ie(t,s,e,n),n}function Gd(t){let e=0|(t=t.u)[A];const s=Rt(t,e,1),a=fr(s,!0);return a!=null&&a!==s&&ie(t,e,1,a),a}function cs(){return Fp===void 0?2:4}function us(t,e,s,a,n){const i=t.u,r=2&(t=0|i[A])?1:a;n=!!n;let o=0|(a=Ar(i,t,e))[A];if(!(4&o)){4&o&&(a=Pe(a),o=Mt(o,t),t=ie(i,t,e,a));let l=0,d=0;for(;l<a.length;l++){const c=s(a[l]);c!=null&&(a[d++]=c)}d<l&&(a.length=d),o=Tr(o,t),s=-4097&(20|o),o=s&=-8193,pe(a,o),2&o&&Object.freeze(a)}return r===1||r===4&&32&o?_t(o)||(n=o,o|=2,o!==n&&pe(a,o),Object.freeze(a)):(r===2&&_t(o)&&(a=Pe(a),o=Mt(o,t),o=Qt(o,t,n),pe(a,o),t=ie(i,t,e,a)),_t(o)||(e=o,o=Qt(o,t,n),o!==e&&pe(a,o))),a}function Ar(t,e,s,a){return t=Rt(t,e,s,a),Array.isArray(t)?t:pr}function Tr(t,e){return t===0&&(t=Mt(t,e)),1|t}function _t(t){return!!(2&t)&&!!(4&t)||!!(2048&t)}function Wd(t){t=Pe(t);for(let e=0;e<t.length;e++){const s=t[e]=Pe(t[e]);Array.isArray(s[1])&&(s[1]=Ys(s[1]))}return t}function Hi(t,e,s,a){let n=0|(t=t.u)[A];Xt(n),ie(t,n,e,(a==="0"?Number(s)===0:s===a)?void 0:s)}function Zs(t,e,s,a,n){Xt(e);var i=!(!(64&e)&&16384&e);const r=(n=Ar(t,e,s,n))!==pr;if(i||!r){let o=i=r?0|n[A]:0;(!r||2&o||_t(o)||4&o&&!(32&o))&&(n=Pe(n),o=Mt(o,e),e=ie(t,e,s,n)),o=-13&Tr(o,e),o=Qt(a?-17&o:16|o,e,!0),o!==i&&pe(n,o)}return n}function fi(t,e){var s=qc;return Lr(Cr(t=t.u),t,0|t[A],s)===e?e:-1}function Cr(t){if(Cn)return t[ia]??(t[ia]=new Map);if(ia in t)return t[ia];const e=new Map;return Object.defineProperty(t,ia,{value:e}),e}function zd(t,e,s,a){const n=Cr(t),i=Lr(n,t,e,s);return i!==a&&(i&&(e=ie(t,e,i)),n.set(s,a)),e}function Lr(t,e,s,a){let n=t.get(a);if(n!=null)return n;n=0;for(let i=0;i<a.length;i++){const r=a[i];Rt(e,s,r)!=null&&(n!==0&&(s=ie(e,s,n)),n=r)}return t.set(a,n),n}function _r(t,e,s,a){let n,i=0|t[A];if((a=Rt(t,i,s,a))!=null&&a.W===Ia)return(e=Dn(a))!==a&&ie(t,i,s,e),e.u;if(Array.isArray(a)){const r=0|a[A];n=2&r?Jt(qn(a,r,!1),e,!0):64&r?a:Jt(n,e,!0)}else n=Jt(void 0,e,!0);return n!==a&&ie(t,i,s,n),n}function Jd(t,e,s,a){let n=0|(t=t.u)[A];return(e=kr(a=Rt(t,n,s,a),e,!1,n))!==a&&e!=null&&ie(t,n,s,e),e}function B(t,e,s,a=!1){if((e=Jd(t,e,s,a))==null)return e;if(!(2&(a=0|(t=t.u)[A]))){const n=Dn(e);n!==e&&ie(t,a,s,e=n)}return e}function Qd(t,e,s,a,n,i,r){t=t.u;var o=!!(2&e);const l=o?1:n;i=!!i,r&&(r=!o);var d=0|(n=Ar(t,e,a))[A];if(!(o=!!(4&d))){var c=n,u=e;const f=!!(2&(d=Tr(d,e)));f&&(u|=2);let p=!f,b=!0,g=0,y=0;for(;g<c.length;g++){const I=kr(c[g],s,!1,u);if(I instanceof s){if(!f){const M=!!(2&(0|I.u[A]));p&&(p=!M),b&&(b=M)}c[y++]=I}}y<g&&(c.length=y),d|=4,d=b?16|d:-17&d,pe(c,d=p?8|d:-9&d),f&&Object.freeze(c)}if(r&&!(8&d||!n.length&&(l===1||l===4&&32&d))){for(_t(d)&&(n=Pe(n),d=Mt(d,e),e=ie(t,e,a,n)),s=n,r=d,c=0;c<s.length;c++)(d=s[c])!==(u=Dn(d))&&(s[c]=u);r|=8,pe(s,r=s.length?-17&r:16|r),d=r}return l===1||l===4&&32&d?_t(d)||(e=d,(d|=!n.length||16&d&&(!o||32&d)?2:2048)!==e&&pe(n,d),Object.freeze(n)):(l===2&&_t(d)&&(pe(n=Pe(n),d=Qt(d=Mt(d,e),e,i)),e=ie(t,e,a,n)),_t(d)||(a=d,(d=Qt(d,e,i))!==a&&pe(n,d))),n}function qt(t,e,s){const a=0|t.u[A];return Qd(t,a,e,s,cs(),!1,!(2&a))}function C(t,e,s,a){return a==null&&(a=void 0),Q(t,s,a)}function ma(t,e,s,a){a==null&&(a=void 0);e:{let n=0|(t=t.u)[A];if(Xt(n),a==null){const i=Cr(t);if(Lr(i,t,n,s)!==e)break e;i.set(s,0)}else n=zd(t,n,s,e);ie(t,n,e,a)}}function Mt(t,e){return-2049&(t=32|(2&e?2|t:-3&t))}function Qt(t,e,s){return 32&e&&s||(t&=-33),t}function xn(t,e,s,a){const n=0|t.u[A];Xt(n),t=Qd(t,n,s,e,2,!0),a=a??new s,t.push(a),t[A]=2&(0|a.u[A])?-9&t[A]:-17&t[A]}function st(t,e){return Ks(Us(t,e))}function nt(t,e){return Hs(Us(t,e))}function de(t,e){return tn(t,e)??0}function Aa(t,e,s){if(s!=null&&typeof s!="boolean")throw t=typeof s,Error(`Expected boolean but got ${t!="object"?t:s?Array.isArray(s)?"array":t:"null"}: ${s}`);Q(t,e,s)}function St(t,e,s){if(s!=null){if(typeof s!="number"||!Pn(s))throw Oi("int32");s|=0}Q(t,e,s)}function $(t,e,s){if(s!=null&&typeof s!="number")throw Error(`Value of float/double field must be a number, found ${typeof s}: ${s}`);Q(t,e,s)}function vn(t,e,s){{const r=t.u;let o=0|r[A];if(Xt(o),s==null)ie(r,o,e);else{var a=t=0|s[A],n=_t(t),i=n||Object.isFrozen(s);for(n||(t=0),i||(s=Pe(s),a=0,t=Qt(t=Mt(t,o),o,!0),i=!1),t|=21,n=0;n<s.length;n++){const l=s[n],d=Nd(l);Object.is(l,d)||(i&&(s=Pe(s),a=0,t=Qt(t=Mt(t,o),o,!0),i=!1),s[n]=d)}t!==a&&(i&&(s=Pe(s),t=Qt(t=Mt(t,o),o,!0)),pe(s,t)),ie(r,o,e,s)}}}function Rn(t,e,s){Xt(0|t.u[A]),us(t,e,Hs,2,!0).push(Nd(s))}function Yd(t,e){return Error(`Invalid wire type: ${t} (at position ${e})`)}function Ir(){return Error("Failed to read varint, encoding is invalid.")}function Kd(t,e){return Error(`Tried to read past the end of the data ${e} > ${t}`)}function Mr(t){if(typeof t=="string")return{buffer:Id(t),N:!1};if(Array.isArray(t))return{buffer:new Uint8Array(t),N:!1};if(t.constructor===Uint8Array)return{buffer:t,N:!1};if(t.constructor===ArrayBuffer)return{buffer:new Uint8Array(t),N:!1};if(t.constructor===It)return{buffer:cr(t)||new Uint8Array(0),N:!0};if(t instanceof Uint8Array)return{buffer:new Uint8Array(t.buffer,t.byteOffset,t.byteLength),N:!1};throw Error("Type not convertible to a Uint8Array, expected a Uint8Array, an ArrayBuffer, a base64 encoded string, a ByteString or an Array of numbers")}function Pr(t,e){let s,a=0,n=0,i=0;const r=t.h;let o=t.g;do s=r[o++],a|=(127&s)<<i,i+=7;while(i<32&&128&s);for(i>32&&(n|=(127&s)>>4),i=3;i<32&&128&s;i+=7)s=r[o++],n|=(127&s)<<i;if(bs(t,o),s<128)return e(a>>>0,n>>>0);throw Ir()}function jr(t){let e=0,s=t.g;const a=s+10,n=t.h;for(;s<a;){const i=n[s++];if(e|=i,(128&i)==0)return bs(t,s),!!(127&e)}throw Ir()}function Yt(t){const e=t.h;let s=t.g,a=e[s++],n=127&a;if(128&a&&(a=e[s++],n|=(127&a)<<7,128&a&&(a=e[s++],n|=(127&a)<<14,128&a&&(a=e[s++],n|=(127&a)<<21,128&a&&(a=e[s++],n|=a<<28,128&a&&128&e[s++]&&128&e[s++]&&128&e[s++]&&128&e[s++]&&128&e[s++])))))throw Ir();return bs(t,s),n}function Dt(t){return Yt(t)>>>0}function Ui(t){var e=t.h;const s=t.g,a=e[s],n=e[s+1],i=e[s+2];return e=e[s+3],bs(t,t.g+4),(a<<0|n<<8|i<<16|e<<24)>>>0}function Vi(t){var e=Ui(t);t=2*(e>>31)+1;const s=e>>>23&255;return e&=8388607,s==255?e?NaN:t*(1/0):s==0?1401298464324817e-60*t*e:t*Math.pow(2,s-150)*(e+8388608)}function ih(t){return Yt(t)}function bi(t,e,{ba:s=!1}={}){t.ba=s,e&&(e=Mr(e),t.h=e.buffer,t.m=e.N,t.j=0,t.l=t.h.length,t.g=t.j)}function bs(t,e){if(t.g=e,e>t.l)throw Kd(t.l,e)}function Xd(t,e){if(e<0)throw Error(`Tried to read a negative byte length: ${e}`);const s=t.g,a=s+e;if(a>t.l)throw Kd(e,t.l-s);return t.g=a,s}function Zd(t,e){if(e==0)return gs();var s=Xd(t,e);return t.ba&&t.m?s=t.h.subarray(s,s+e):(t=t.h,s=s===(e=s+e)?new Uint8Array(0):Wp?t.slice(s,e):new Uint8Array(t.subarray(s,e))),s.length==0?gs():new It(s,Fs)}at.prototype.toJSON=void 0,at.prototype.Ia=Dd;var Zo=[];function ec(t){var e=t.g;if(e.g==e.l)return!1;t.l=t.g.g;var s=Dt(t.g);if(e=s>>>3,!((s&=7)>=0&&s<=5))throw Yd(s,t.l);if(e<1)throw Error(`Invalid field number: ${e} (at position ${t.l})`);return t.m=e,t.h=s,!0}function sn(t){switch(t.h){case 0:t.h!=0?sn(t):jr(t.g);break;case 1:bs(t=t.g,t.g+8);break;case 2:if(t.h!=2)sn(t);else{var e=Dt(t.g);bs(t=t.g,t.g+e)}break;case 5:bs(t=t.g,t.g+4);break;case 3:for(e=t.m;;){if(!ec(t))throw Error("Unmatched start-group tag: stream EOF");if(t.h==4){if(t.m!=e)throw Error("Unmatched end-group tag");break}sn(t)}break;default:throw Yd(t.h,t.l)}}function Ma(t,e,s){const a=t.g.l,n=Dt(t.g),i=t.g.g+n;let r=i-a;if(r<=0&&(t.g.l=i,s(e,t,void 0,void 0,void 0),r=i-t.g.g),r)throw Error(`Message parsing ended unexpectedly. Expected to read ${n} bytes, instead read ${n-r} bytes, either the data ended unexpectedly or the message misreported its own length`);return t.g.g=i,t.g.l=a,e}function qr(t){var e=Dt(t.g),s=Xd(t=t.g,e);if(t=t.h,Tp){var a,n=t;(a=oi)||(a=oi=new TextDecoder("utf-8",{fatal:!0})),e=s+e,n=s===0&&e===n.length?n:n.subarray(s,e);try{var i=a.decode(n)}catch(o){if(Na===void 0){try{a.decode(new Uint8Array([128]))}catch{}try{a.decode(new Uint8Array([97])),Na=!0}catch{Na=!1}}throw!Na&&(oi=void 0),o}}else{e=(i=s)+e,s=[];let o,l=null;for(;i<e;){var r=t[i++];r<128?s.push(r):r<224?i>=e?ss():(o=t[i++],r<194||(192&o)!=128?(i--,ss()):s.push((31&r)<<6|63&o)):r<240?i>=e-1?ss():(o=t[i++],(192&o)!=128||r===224&&o<160||r===237&&o>=160||(192&(a=t[i++]))!=128?(i--,ss()):s.push((15&r)<<12|(63&o)<<6|63&a)):r<=244?i>=e-2?ss():(o=t[i++],(192&o)!=128||o-144+(r<<28)>>30||(192&(a=t[i++]))!=128||(192&(n=t[i++]))!=128?(i--,ss()):(r=(7&r)<<18|(63&o)<<12|(63&a)<<6|63&n,r-=65536,s.push(55296+(r>>10&1023),56320+(1023&r)))):ss(),s.length>=8192&&(l=Do(l,s),s.length=0)}i=Do(l,s)}return i}function tc(t){const e=Dt(t.g);return Zd(t.g,e)}function On(t,e,s){var a=Dt(t.g);for(a=t.g.g+a;t.g.g<a;)s.push(e(t.g))}var Ba=[];function rh(t){return t}let Ps;function ut(t,e,s){e.g?e.m(t,e.g,e.h,s):e.m(t,e.h,s)}var w=class{constructor(t,e){this.u=Vd(t,e)}toJSON(){const t=!Ps;try{return t&&(Ps=Ud),sc(this)}finally{t&&(Ps=void 0)}}l(){var t=Hh;return t.g?t.l(this,t.g,t.h,!0):t.l(this,t.h,t.defaultValue,!0)}clone(){const t=this.u;return new this.constructor(qn(t,0|t[A],!1))}N(){return!!(2&(0|this.u[A]))}};function sc(t){var e=t.u;{e=(t=Ps(e))!==e;let d=t.length;if(d){var s=t[d-1],a=hr(s);a?d--:s=void 0;var n=t;if(a){e:{var i,r=s,o=!1;if(r)for(let c in r)isNaN(+c)?(i??(i={}))[c]=r[c]:(a=r[c],Array.isArray(a)&&(fn(a)||Uo(a)&&a.size===0)&&(a=null),a==null&&(o=!0),a!=null&&((i??(i={}))[c]=a));if(o||(i=r),i)for(let c in i){o=i;break e}o=null}r=o==null?s!=null:o!==s}for(;d>0&&((i=n[d-1])==null||fn(i)||Uo(i)&&i.size===0);d--)var l=!0;(n!==t||r||l)&&(e?(l||r||o)&&(n.length=d):n=Array.prototype.slice.call(n,0,d),o&&n.push(o)),l=n}else l=t}return l}function el(t){return t?/^\d+$/.test(t)?(Mn(t),new Gi(J,oe)):null:oh||(oh=new Gi(0,0))}w.prototype.W=Ia,w.prototype.toString=function(){try{return Ps=rh,sc(this).toString()}finally{Ps=void 0}};var Gi=class{constructor(t,e){this.h=t>>>0,this.g=e>>>0}};let oh;function tl(t){return t?/^-?\d+$/.test(t)?(Mn(t),new Wi(J,oe)):null:lh||(lh=new Wi(0,0))}var Wi=class{constructor(t,e){this.h=t>>>0,this.g=e>>>0}};let lh;function js(t,e,s){for(;s>0||e>127;)t.g.push(127&e|128),e=(e>>>7|s<<25)>>>0,s>>>=7;t.g.push(e)}function ea(t,e){for(;e>127;)t.g.push(127&e|128),e>>>=7;t.g.push(e)}function Fn(t,e){if(e>=0)ea(t,e);else{for(let s=0;s<9;s++)t.g.push(127&e|128),e>>=7;t.g.push(1)}}function Ta(t,e){t.g.push(e>>>0&255),t.g.push(e>>>8&255),t.g.push(e>>>16&255),t.g.push(e>>>24&255)}function Vs(t,e){e.length!==0&&(t.l.push(e),t.h+=e.length)}function ze(t,e,s){ea(t.g,8*e+s)}function Dr(t,e){return ze(t,e,2),e=t.g.end(),Vs(t,e),e.push(t.h),e}function Rr(t,e){var s=e.pop();for(s=t.h+t.g.length()-s;s>127;)e.push(127&s|128),s>>>=7,t.h++;e.push(s),t.h++}function Nn(t,e,s){ze(t,e,2),ea(t.g,s.length),Vs(t,t.g.end()),Vs(t,s)}function yn(t,e,s,a){s!=null&&(e=Dr(t,e),a(s,t),Rr(t,e))}function pt(){const t=class{constructor(){throw Error()}};return Object.setPrototypeOf(t,t.prototype),t}var Or=pt(),ac=pt(),Fr=pt(),Nr=pt(),nc=pt(),ic=pt(),Br=pt(),rc=pt(),oc=pt(),ta=class{constructor(t,e,s){this.g=t,this.h=e,t=Or,this.l=!!t&&s===t||!1}};function Bn(t,e){return new ta(t,e,Or)}function lc(t,e,s,a,n){yn(t,s,pc(e,a),n)}const dh=Bn(function(t,e,s,a,n){return t.h===2&&(Ma(t,_r(e,a,s),n),!0)},lc),ch=Bn(function(t,e,s,a,n){return t.h===2&&(Ma(t,_r(e,a,s,!0),n),!0)},lc);var Hn=Symbol(),Hr=Symbol(),sl=Symbol(),al=Symbol();let dc,cc;function xs(t,e,s,a){var n=a[t];if(n)return n;(n={}).Pa=a,n.V=function(u){switch(typeof u){case"boolean":return Bd||(Bd=[0,void 0,!0]);case"number":return u>0?void 0:u===0?ah||(ah=[0,void 0]):[-u,void 0];case"string":return[0,u];case"object":return u}}(a[0]);var i=a[1];let r=1;i&&i.constructor===Object&&(n.ga=i,typeof(i=a[++r])=="function"&&(n.la=!0,dc??(dc=i),cc??(cc=a[r+1]),i=a[r+=2]));const o={};for(;i&&Array.isArray(i)&&i.length&&typeof i[0]=="number"&&i[0]>0;){for(var l=0;l<i.length;l++)o[i[l]]=i;i=a[++r]}for(l=1;i!==void 0;){let u;typeof i=="number"&&(l+=i,i=a[++r]);var d=void 0;if(i instanceof ta?u=i:(u=dh,r--),u==null?void 0:u.l){i=a[++r],d=a;var c=r;typeof i=="function"&&(i=i(),d[c]=i),d=i}for(c=l+1,typeof(i=a[++r])=="number"&&i<0&&(c-=i,i=a[++r]);l<c;l++){const f=o[l];d?s(n,l,u,d,f):e(n,l,u,f)}}return a[t]=n}function uc(t){return Array.isArray(t)?t[0]instanceof ta?t:[ch,t]:[t,void 0]}function pc(t,e){return t instanceof w?t.u:Array.isArray(t)?Jt(t,e,!1):void 0}function Ur(t,e,s,a){const n=s.g;t[e]=a?(i,r,o)=>n(i,r,o,a):n}function Vr(t,e,s,a,n){const i=s.g;let r,o;t[e]=(l,d,c)=>i(l,d,c,o||(o=xs(Hr,Ur,Vr,a).V),r||(r=Gr(a)),n)}function Gr(t){let e=t[sl];if(e!=null)return e;const s=xs(Hr,Ur,Vr,t);return e=s.la?(a,n)=>dc(a,n,s):(a,n)=>{const i=0|a[A];for(;ec(n)&&n.h!=4;){var r=n.m,o=s[r];if(o==null){var l=s.ga;l&&(l=l[r])&&(l=uh(l))!=null&&(o=s[r]=l)}o!=null&&o(n,a,r)||(r=(o=n).l,sn(o),o.fa?o=void 0:(l=o.g.g-r,o.g.g=r,o=Zd(o.g,l)),r=a,o&&((l=r[Ns])?l.push(o):r[Ns]=[o]))}return 16384&i&&Ys(a),!0},t[sl]=e}function uh(t){const e=(t=uc(t))[0].g;if(t=t[1]){const s=Gr(t),a=xs(Hr,Ur,Vr,t).V;return(n,i,r)=>e(n,i,r,a,s)}return e}function Un(t,e,s){t[e]=s.h}function Vn(t,e,s,a){let n,i;const r=s.h;t[e]=(o,l,d)=>r(o,l,d,i||(i=xs(Hn,Un,Vn,a).V),n||(n=hc(a)))}function hc(t){let e=t[al];if(!e){const s=xs(Hn,Un,Vn,t);e=(a,n)=>fc(a,n,s),t[al]=e}return e}function fc(t,e,s){for(var a=0|t[A],n=512&a?0:-1,i=t.length,r=512&a?1:0,o=i+(256&a?-1:0);r<o;r++){const l=t[r];if(l==null)continue;const d=r-n,c=nl(s,d);c&&c(e,l,d)}if(256&a){a=t[i-1];for(const l in a)n=+l,Number.isNaN(n)||(i=a[n])!=null&&(o=nl(s,n))&&o(e,i,n)}if(t=br(t))for(Vs(e,e.g.end()),s=0;s<t.length;s++)Vs(e,cr(t[s])||new Uint8Array(0))}function nl(t,e){var s=t[e];if(s)return s;if((s=t.ga)&&(s=s[e])){var a=(s=uc(s))[0].h;if(s=s[1]){const n=hc(s),i=xs(Hn,Un,Vn,s).V;s=t.la?cc(i,n):(r,o,l)=>a(r,o,l,i,n)}else s=a;return t[e]=s}}function sa(t,e){if(Array.isArray(e)){var s=0|e[A];if(4&s)return e;for(var a=0,n=0;a<e.length;a++){const i=t(e[a]);i!=null&&(e[n++]=i)}return n<a&&(e.length=n),pe(e,-12289&(5|s)),2&s&&Object.freeze(e),e}}function Ae(t,e,s){return new ta(t,e,s)}function aa(t,e,s){return new ta(t,e,s)}function Te(t,e,s){ie(t,0|t[A],e,s)}var ph=Bn(function(t,e,s,a,n){return t.h===2&&(t=Ma(t,Jt([void 0,void 0],a,!0),n),Xt(a=0|e[A]),(n=Rt(e,a,s))instanceof at?2&n.L?((n=n.X()).push(t),ie(e,a,s,n)):n.Na(t):Array.isArray(n)?(2&(0|n[A])&&ie(e,a,s,n=Wd(n)),n.push(t)):ie(e,a,s,[t]),!0)},function(t,e,s,a,n){if(e instanceof at)e.forEach((i,r)=>{yn(t,s,Jt([r,i],a,!1),n)});else if(Array.isArray(e))for(let i=0;i<e.length;i++){const r=e[i];Array.isArray(r)&&yn(t,s,Jt(r,a,!1),n)}});function bc(t,e,s){if(e=function(a){if(a==null)return a;const n=typeof a;if(n==="bigint")return String(yr(64,a));if(jn(a)){if(n==="string")return Sr(a);if(n==="number")return wr(a)}}(e),e!=null&&(typeof e=="string"&&tl(e),e!=null))switch(ze(t,s,0),typeof e){case"number":t=t.g,Bs(e),js(t,J,oe);break;case"bigint":s=BigInt.asUintN(64,e),s=new Wi(Number(s&BigInt(4294967295)),Number(s>>BigInt(32))),js(t.g,s.h,s.g);break;default:s=tl(e),js(t.g,s.h,s.g)}}function mc(t,e,s){(e=Ks(e))!=null&&e!=null&&(ze(t,s,0),Fn(t.g,e))}function gc(t,e,s){(e=Od(e))!=null&&(ze(t,s,0),t.g.g.push(e?1:0))}function xc(t,e,s){(e=Hs(e))!=null&&Nn(t,s,Ad(e))}function vc(t,e,s,a,n){yn(t,s,pc(e,a),n)}function yc(t,e,s){(e=e==null||typeof e=="string"||La(e)||e instanceof It?e:void 0)!=null&&Nn(t,s,Mr(e).buffer)}function wc(t,e,s){return(t.h===5||t.h===2)&&(e=Zs(e,0|e[A],s,!1,!1),t.h==2?On(t,Vi,e):e.push(Vi(t.g)),!0)}var Tt=Ae(function(t,e,s){if(t.h!==1)return!1;var a=t.g;t=Ui(a);const n=Ui(a);a=2*(n>>31)+1;const i=n>>>20&2047;return t=4294967296*(1048575&n)+t,Te(e,s,i==2047?t?NaN:a*(1/0):i==0?5e-324*a*t:a*Math.pow(2,i-1075)*(t+4503599627370496)),!0},function(t,e,s){(e=Zt(e))!=null&&(ze(t,s,1),t=t.g,(s=Rd||(Rd=new DataView(new ArrayBuffer(8)))).setFloat64(0,+e,!0),J=s.getUint32(0,!0),oe=s.getUint32(4,!0),Ta(t,J),Ta(t,oe))},pt()),he=Ae(function(t,e,s){return t.h===5&&(Te(e,s,Vi(t.g)),!0)},function(t,e,s){(e=Zt(e))!=null&&(ze(t,s,5),t=t.g,mr(e),Ta(t,J))},Br),hh=aa(wc,function(t,e,s){if((e=sa(Zt,e))!=null)for(let r=0;r<e.length;r++){var a=t,n=s,i=e[r];i!=null&&(ze(a,n,5),a=a.g,mr(i),Ta(a,J))}},Br),Wr=aa(wc,function(t,e,s){if((e=sa(Zt,e))!=null&&e.length){ze(t,s,2),ea(t.g,4*e.length);for(let a=0;a<e.length;a++)s=t.g,mr(e[a]),Ta(s,J)}},Br),Kt=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Pr(t.g,xr)),!0)},bc,ic),mi=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Pr(t.g,xr))===0?void 0:t),!0)},bc,ic),fh=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Pr(t.g,gr)),!0)},function(t,e,s){if((e=Qp(e))!=null&&(typeof e=="string"&&el(e),e!=null))switch(ze(t,s,0),typeof e){case"number":t=t.g,Bs(e),js(t,J,oe);break;case"bigint":s=BigInt.asUintN(64,e),s=new Gi(Number(s&BigInt(4294967295)),Number(s>>BigInt(32))),js(t.g,s.h,s.g);break;default:s=el(e),js(t.g,s.h,s.g)}},pt()),le=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Yt(t.g)),!0)},mc,Nr),Gn=aa(function(t,e,s){return(t.h===0||t.h===2)&&(e=Zs(e,0|e[A],s,!1,!1),t.h==2?On(t,Yt,e):e.push(Yt(t.g)),!0)},function(t,e,s){if((e=sa(Ks,e))!=null&&e.length){s=Dr(t,s);for(let a=0;a<e.length;a++)Fn(t.g,e[a]);Rr(t,s)}},Nr),Is=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Yt(t.g))===0?void 0:t),!0)},mc,Nr),ae=Ae(function(t,e,s){return t.h===0&&(Te(e,s,jr(t.g)),!0)},gc,ac),qs=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=jr(t.g))===!1?void 0:t),!0)},gc,ac),Se=aa(function(t,e,s){return t.h===2&&(t=qr(t),Zs(e,0|e[A],s,!1).push(t),!0)},function(t,e,s){if((e=sa(Hs,e))!=null)for(let r=0;r<e.length;r++){var a=t,n=s,i=e[r];i!=null&&Nn(a,n,Ad(i))}},Fr),zt=Ae(function(t,e,s){return t.h===2&&(Te(e,s,(t=qr(t))===""?void 0:t),!0)},xc,Fr),G=Ae(function(t,e,s){return t.h===2&&(Te(e,s,qr(t)),!0)},xc,Fr),me=function(t,e,s=Or){return new ta(t,e,s)}(function(t,e,s,a,n){return t.h===2&&(a=Jt(void 0,a,!0),Zs(e,0|e[A],s,!0).push(a),Ma(t,a,n),!0)},function(t,e,s,a,n){if(Array.isArray(e))for(let i=0;i<e.length;i++)vc(t,e[i],s,a,n)}),W=Bn(function(t,e,s,a,n,i){return t.h===2&&(zd(e,0|e[A],i,s),Ma(t,e=_r(e,a,s),n),!0)},vc),Sc=Ae(function(t,e,s){return t.h===2&&(Te(e,s,tc(t)),!0)},yc,rc),bh=aa(function(t,e,s){return(t.h===0||t.h===2)&&(e=Zs(e,0|e[A],s,!1,!1),t.h==2?On(t,Dt,e):e.push(Dt(t.g)),!0)},function(t,e,s){if((e=sa(Fd,e))!=null)for(let r=0;r<e.length;r++){var a=t,n=s,i=e[r];i!=null&&(ze(a,n,0),ea(a.g,i))}},nc),mh=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Dt(t.g))===0?void 0:t),!0)},function(t,e,s){(e=Fd(e))!=null&&e!=null&&(ze(t,s,0),ea(t.g,e))},nc),it=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Yt(t.g)),!0)},function(t,e,s){(e=Ks(e))!=null&&(e=parseInt(e,10),ze(t,s,0),Fn(t.g,e))},oc);class gh{constructor(e,s){this.h=e,this.g=s,this.l=B,this.m=C,this.defaultValue=void 0}}function ht(t,e){return new gh(t,e)}function es(t,e){return(s,a)=>{if(Ba.length){const i=Ba.pop();i.o(a),bi(i.g,s,a),s=i}else s=new class{constructor(i,r){if(Zo.length){const o=Zo.pop();bi(o,i,r),i=o}else i=new class{constructor(o,l){this.h=null,this.m=!1,this.g=this.l=this.j=0,bi(this,o,l)}clear(){this.h=null,this.m=!1,this.g=this.l=this.j=0,this.ba=!1}}(i,r);this.g=i,this.l=this.g.g,this.h=this.m=-1,this.o(r)}o({fa:i=!1}={}){this.fa=i}}(s,a);try{const i=new t,r=i.u;Gr(e)(r,s);var n=i}finally{s.g.clear(),s.m=-1,s.h=-1,Ba.length<100&&Ba.push(s)}return n}}function Wn(t){return function(){const e=new class{constructor(){this.l=[],this.h=0,this.g=new class{constructor(){this.g=[]}length(){return this.g.length}end(){const r=this.g;return this.g=[],r}}}};fc(this.u,e,xs(Hn,Un,Vn,t)),Vs(e,e.g.end());const s=new Uint8Array(e.h),a=e.l,n=a.length;let i=0;for(let r=0;r<n;r++){const o=a[r];s.set(o,i),i+=o.length}return e.l=[s],s}}var il=class extends w{constructor(t){super(t)}},rl=[0,zt,Ae(function(t,e,s){return t.h===2&&(Te(e,s,(t=tc(t))===gs()?void 0:t),!0)},function(t,e,s){if(e!=null){if(e instanceof w){const a=e.Ra;return void(a&&(e=a(e),e!=null&&Nn(t,s,Mr(e).buffer)))}if(Array.isArray(e))return}yc(t,e,s)},rc)];let gi,ol=globalThis.trustedTypes;function ll(t){gi===void 0&&(gi=function(){let s=null;if(!ol)return s;try{const a=n=>n;s=ol.createPolicy("goog#html",{createHTML:a,createScript:a,createScriptURL:a})}catch{}return s}());var e=gi;return new class{constructor(s){this.g=s}toString(){return this.g+""}}(e?e.createScriptURL(t):t)}function xh(t,...e){if(e.length===0)return ll(t[0]);let s=t[0];for(let a=0;a<e.length;a++)s+=encodeURIComponent(e[a])+t[a+1];return ll(s)}var kc=[0,le,it,ae,-1,Gn,it,-1],vh=class extends w{constructor(t){super(t)}},$c=[0,ae,G,ae,it,-1,aa(function(t,e,s){return(t.h===0||t.h===2)&&(e=Zs(e,0|e[A],s,!1,!1),t.h==2?On(t,ih,e):e.push(Yt(t.g)),!0)},function(t,e,s){if((e=sa(Ks,e))!=null&&e.length){s=Dr(t,s);for(let a=0;a<e.length;a++)Fn(t.g,e[a]);Rr(t,s)}},oc),G,-1,[0,ae,-1],it,ae,-1],Ec=[0,G,-2],dl=class extends w{constructor(t){super(t)}},Ac=[0],Tc=[0,le,ae,1,ae,-3],We=class extends w{constructor(t){super(t,2)}},fe={};fe[336783863]=[0,G,ae,-1,le,[0,[1,2,3,4,5,6,7,8],W,Ac,W,$c,W,Ec,W,Tc,W,kc,W,[0,G,-2],W,[0,G,it],W,[0,it,G]],[0,G],ae,[0,[1,3],[2,4],W,[0,Gn],-1,W,[0,Se],-1,me,[0,G,-1]],G];var cl=[0,mi,-1,qs,-3,mi,Gn,zt,Is,mi,-1,qs,Is,qs,-2,zt];function Je(t,e){Hi(t,2,Xs(e),"")}function Y(t,e){Rn(t,3,e)}function O(t,e){Rn(t,4,e)}var Ee=class extends w{constructor(t){super(t,500)}o(t){return C(this,0,7,t)}},ga=[-1,{}],ul=[0,G,1,ga],pl=[0,G,Se,ga];function Qe(t,e){xn(t,1,Ee,e)}function ee(t,e){Rn(t,10,e)}function U(t,e){Rn(t,15,e)}var qe=class extends w{constructor(t){super(t,500)}o(t){return C(this,0,1001,t)}},Cc=[-500,me,[-500,zt,-1,Se,-3,[-2,fe,ae],me,rl,Is,-1,ul,pl,me,[0,zt,qs],zt,cl,Is,Se,987,Se],4,me,[-500,G,-1,[-1,{}],998,G],me,[-500,G,Se,-1,[-2,{},ae],997,Se,-1],Is,me,[-500,G,Se,ga,998,Se],Se,Is,ul,pl,me,[0,zt,-1,ga],Se,-2,cl,zt,-1,qs,[0,qs,mh],978,ga,me,rl];qe.prototype.g=Wn(Cc);var yh=es(qe,Cc),wh=class extends w{constructor(t){super(t)}},Lc=class extends w{constructor(t){super(t)}g(){return qt(this,wh,1)}},_c=[0,me,[0,le,he,G,-1]],zn=es(Lc,_c),Sh=class extends w{constructor(t){super(t)}},kh=class extends w{constructor(t){super(t)}},xi=class extends w{constructor(t){super(t)}h(){return B(this,Sh,2)}g(){return qt(this,kh,5)}},Ic=es(class extends w{constructor(t){super(t)}},[0,Se,Gn,Wr,[0,it,[0,le,-3],[0,he,-3],[0,le,-1,[0,me,[0,le,-2]]],me,[0,he,-1,G,he]],G,-1,Kt,me,[0,le,he],Se,Kt]),Mc=class extends w{constructor(t){super(t)}},Ds=es(class extends w{constructor(t){super(t)}},[0,me,[0,he,-4]]),Pc=class extends w{constructor(t){super(t)}},Pa=es(class extends w{constructor(t){super(t)}},[0,me,[0,he,-4]]),$h=class extends w{constructor(t){super(t)}},Eh=[0,le,-1,Wr,it],jc=class extends w{constructor(t){super(t)}};jc.prototype.g=Wn([0,he,-4,Kt]);var Ah=class extends w{constructor(t){super(t)}},Th=es(class extends w{constructor(t){super(t)}},[0,me,[0,1,le,G,_c],Kt]),hl=class extends w{constructor(t){super(t)}},Ch=class extends w{constructor(t){super(t)}oa(){const t=Gd(this);return t??gs()}},Lh=class extends w{constructor(t){super(t)}},qc=[1,2],_h=es(class extends w{constructor(t){super(t)}},[0,me,[0,qc,W,[0,Wr],W,[0,Sc],le,G],Kt]),zr=class extends w{constructor(t){super(t)}},Dc=[0,G,le,he,Se,-1],fl=class extends w{constructor(t){super(t)}},Ih=[0,ae,-1],bl=class extends w{constructor(t){super(t)}},an=[1,2,3,4,5],wn=class extends w{constructor(t){super(t)}g(){return Gd(this)!=null}h(){return nt(this,2)!=null}},ne=class extends w{constructor(t){super(t)}g(){return Od(Us(this,2))??!1}},Rc=[0,Sc,G,[0,le,Kt,-1],[0,fh,Kt]],ce=[0,Rc,ae,[0,an,W,Tc,W,$c,W,kc,W,Ac,W,Ec],it],Jn=class extends w{constructor(t){super(t)}},Jr=[0,ce,he,-1,le],Mh=ht(502141897,Jn);fe[502141897]=Jr;var Ph=es(class extends w{constructor(t){super(t)}},[0,[0,it,-1,hh,bh],Eh]),Oc=class extends w{constructor(t){super(t)}},Fc=class extends w{constructor(t){super(t)}},Qr=[0,ce,he,[0,ce],ae],Nc=[0,ce,Jr,Qr,he,[0,[0,Rc]]],jh=ht(508968150,Fc);fe[508968150]=Nc,fe[508968149]=Qr;var Bc=class extends w{constructor(t){super(t)}},qh=ht(513916220,Bc);fe[513916220]=[0,ce,Nc,le];var $s=class extends w{constructor(t){super(t)}h(){return B(this,zr,2)}g(){Q(this,2)}},Hc=[0,ce,Dc];fe[478825465]=Hc;var Dh=class extends w{constructor(t){super(t)}},Uc=class extends w{constructor(t){super(t)}},Yr=class extends w{constructor(t){super(t)}},Kr=class extends w{constructor(t){super(t)}},Vc=class extends w{constructor(t){super(t)}},ml=[0,ce,[0,ce],Hc,-1],Gc=[0,ce,he,le],Xr=[0,ce,he],Wc=[0,ce,Gc,Xr,he],Rh=ht(479097054,Vc);fe[479097054]=[0,ce,Wc,ml],fe[463370452]=ml,fe[464864288]=Gc;var Oh=ht(462713202,Kr);fe[462713202]=Wc,fe[474472470]=Xr;var Fh=class extends w{constructor(t){super(t)}},zc=class extends w{constructor(t){super(t)}},Jc=class extends w{constructor(t){super(t)}},Qc=class extends w{constructor(t){super(t)}},Zr=[0,ce,he,-1,le],zi=[0,ce,he,ae];Qc.prototype.g=Wn([0,ce,Xr,[0,ce],Jr,Qr,Zr,zi]);var Yc=class extends w{constructor(t){super(t)}},Nh=ht(456383383,Yc);fe[456383383]=[0,ce,Dc];var Kc=class extends w{constructor(t){super(t)}},Bh=ht(476348187,Kc);fe[476348187]=[0,ce,Ih];var Xc=class extends w{constructor(t){super(t)}},gl=class extends w{constructor(t){super(t)}},Zc=[0,it,-1],Hh=ht(458105876,class extends w{constructor(t){super(t)}g(){var t=this.u;const e=0|t[A],s=2&e;return t=function(a,n,i){var r=gl;const o=2&n;let l=!1;if(i==null){if(o)return Xo();i=[]}else if(i.constructor===at){if(!(2&i.L)||o)return i;i=i.X()}else Array.isArray(i)?l=!!(2&(0|i[A])):i=[];if(o){if(!i.length)return Xo();l||(l=!0,Ys(i))}else l&&(l=!1,i=Wd(i));return l||(64&(0|i[A])?i[A]&=-33:32&n&&Ln(i,32)),ie(a,n,2,r=new at(i,r,Yp,void 0)),r}(t,e,Rt(t,e,2)),!s&&gl&&(t.ra=!0),t}});fe[458105876]=[0,Zc,ph,[!0,Kt,[0,G,-1,Se]]];var eo=class extends w{constructor(t){super(t)}},eu=ht(458105758,eo);fe[458105758]=[0,ce,G,Zc];var tu=class extends w{constructor(t){super(t)}},Uh=ht(443442058,tu);fe[443442058]=[0,ce,G,le,he,Se,-1,ae,he],fe[514774813]=Zr;var su=class extends w{constructor(t){super(t)}},Vh=ht(516587230,su);function Ji(t,e){return e=e?e.clone():new zr,t.displayNamesLocale!==void 0?Q(e,1,Xs(t.displayNamesLocale)):t.displayNamesLocale===void 0&&Q(e,1),t.maxResults!==void 0?St(e,2,t.maxResults):"maxResults"in t&&Q(e,2),t.scoreThreshold!==void 0?$(e,3,t.scoreThreshold):"scoreThreshold"in t&&Q(e,3),t.categoryAllowlist!==void 0?vn(e,4,t.categoryAllowlist):"categoryAllowlist"in t&&Q(e,4),t.categoryDenylist!==void 0?vn(e,5,t.categoryDenylist):"categoryDenylist"in t&&Q(e,5),e}function to(t,e=-1,s=""){return{categories:t.map(a=>({index:st(a,1)??0??-1,score:de(a,2)??0,categoryName:nt(a,3)??""??"",displayName:nt(a,4)??""??""})),headIndex:e,headName:s}}function au(t){var r,o;var e=us(t,3,Zt,cs()),s=us(t,2,Ks,cs()),a=us(t,1,Hs,cs()),n=us(t,9,Hs,cs());const i={categories:[],keypoints:[]};for(let l=0;l<e.length;l++)i.categories.push({score:e[l],index:s[l]??-1,categoryName:a[l]??"",displayName:n[l]??""});if((e=(r=B(t,xi,4))==null?void 0:r.h())&&(i.boundingBox={originX:st(e,1)??0,originY:st(e,2)??0,width:st(e,3)??0,height:st(e,4)??0,angle:0}),(o=B(t,xi,4))==null?void 0:o.g().length)for(const l of B(t,xi,4).g())i.keypoints.push({x:tn(l,1)??0,y:tn(l,2)??0,score:tn(l,4)??0,label:nt(l,3)??""});return i}function Qn(t){const e=[];for(const s of qt(t,Pc,1))e.push({x:de(s,1)??0,y:de(s,2)??0,z:de(s,3)??0,visibility:de(s,4)??0});return e}function xa(t){const e=[];for(const s of qt(t,Mc,1))e.push({x:de(s,1)??0,y:de(s,2)??0,z:de(s,3)??0,visibility:de(s,4)??0});return e}function xl(t){return Array.from(t,e=>e>127?e-256:e)}function vl(t,e){if(t.length!==e.length)throw Error(`Cannot compute cosine similarity between embeddings of different sizes (${t.length} vs. ${e.length}).`);let s=0,a=0,n=0;for(let i=0;i<t.length;i++)s+=t[i]*e[i],a+=t[i]*t[i],n+=e[i]*e[i];if(a<=0||n<=0)throw Error("Cannot compute cosine similarity on embedding with 0 norm.");return s/Math.sqrt(a*n)}let Ha;fe[516587230]=[0,ce,Zr,zi,he],fe[518928384]=zi;const Gh=new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]);async function nu(){if(Ha===void 0)try{await WebAssembly.instantiate(Gh),Ha=!0}catch{Ha=!1}return Ha}async function ra(t,e=xh``){const s=await nu()?"wasm_internal":"wasm_nosimd_internal";return{wasmLoaderPath:`${e}/${t}_${s}.js`,wasmBinaryPath:`${e}/${t}_${s}.wasm`}}var os=class{};function iu(){var t=navigator;return typeof OffscreenCanvas<"u"&&(!function(e=navigator){return(e=e.userAgent).includes("Safari")&&!e.includes("Chrome")}(t)||!!((t=t.userAgent.match(/Version\/([\d]+).*Safari/))&&t.length>=1&&Number(t[1])>=17))}async function yl(t){if(typeof importScripts!="function"){const e=document.createElement("script");return e.src=t.toString(),e.crossOrigin="anonymous",new Promise((s,a)=>{e.addEventListener("load",()=>{s()},!1),e.addEventListener("error",n=>{a(n)},!1),document.body.appendChild(e)})}importScripts(t.toString())}function ru(t){return t.videoWidth!==void 0?[t.videoWidth,t.videoHeight]:t.naturalWidth!==void 0?[t.naturalWidth,t.naturalHeight]:t.displayWidth!==void 0?[t.displayWidth,t.displayHeight]:[t.width,t.height]}function E(t,e,s){t.m||console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target"),s(e=t.i.stringToNewUTF8(e)),t.i._free(e)}function wl(t,e,s){if(!t.i.canvas)throw Error("No OpenGL canvas configured.");if(s?t.i._bindTextureToStream(s):t.i._bindTextureToCanvas(),!(s=t.i.canvas.getContext("webgl2")||t.i.canvas.getContext("webgl")))throw Error("Failed to obtain WebGL context from the provided canvas. `getContext()` should only be invoked with `webgl` or `webgl2`.");t.i.gpuOriginForWebTexturesIsBottomLeft&&s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!0),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,e),t.i.gpuOriginForWebTexturesIsBottomLeft&&s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1);const[a,n]=ru(e);return!t.l||a===t.i.canvas.width&&n===t.i.canvas.height||(t.i.canvas.width=a,t.i.canvas.height=n),[a,n]}function Sl(t,e,s){t.m||console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target");const a=new Uint32Array(e.length);for(let n=0;n<e.length;n++)a[n]=t.i.stringToNewUTF8(e[n]);e=t.i._malloc(4*a.length),t.i.HEAPU32.set(a,e>>2),s(e);for(const n of a)t.i._free(n);t.i._free(e)}function mt(t,e,s){t.i.simpleListeners=t.i.simpleListeners||{},t.i.simpleListeners[e]=s}function Ut(t,e,s){let a=[];t.i.simpleListeners=t.i.simpleListeners||{},t.i.simpleListeners[e]=(n,i,r)=>{i?(s(a,r),a=[]):a.push(n)}}os.forVisionTasks=function(t){return ra("vision",t)},os.forTextTasks=function(t){return ra("text",t)},os.forGenAiExperimentalTasks=function(t){return ra("genai_experimental",t)},os.forGenAiTasks=function(t){return ra("genai",t)},os.forAudioTasks=function(t){return ra("audio",t)},os.isSimdSupported=function(){return nu()};async function Wh(t,e,s,a){return t=await(async(n,i,r,o,l)=>{if(i&&await yl(i),!self.ModuleFactory||r&&(await yl(r),!self.ModuleFactory))throw Error("ModuleFactory not set.");return self.Module&&l&&((i=self.Module).locateFile=l.locateFile,l.mainScriptUrlOrBlob&&(i.mainScriptUrlOrBlob=l.mainScriptUrlOrBlob)),l=await self.ModuleFactory(self.Module||l),self.ModuleFactory=self.Module=void 0,new n(l,o)})(t,s.wasmLoaderPath,s.assetLoaderPath,e,{locateFile:n=>n.endsWith(".wasm")?s.wasmBinaryPath.toString():s.assetBinaryPath&&n.endsWith(".data")?s.assetBinaryPath.toString():n}),await t.o(a),t}function vi(t,e){const s=B(t.baseOptions,wn,1)||new wn;typeof e=="string"?(Q(s,2,Xs(e)),Q(s,1)):e instanceof Uint8Array&&(Q(s,1,fr(e,!1)),Q(s,2)),C(t.baseOptions,0,1,s)}function kl(t){try{const e=t.G.length;if(e===1)throw Error(t.G[0].message);if(e>1)throw Error("Encountered multiple errors: "+t.G.map(s=>s.message).join(", "))}finally{t.G=[]}}function v(t,e){t.B=Math.max(t.B,e)}function Yn(t,e){t.A=new Ee,Je(t.A,"PassThroughCalculator"),Y(t.A,"free_memory"),O(t.A,"free_memory_unused_out"),ee(e,"free_memory"),Qe(e,t.A)}function Gs(t,e){Y(t.A,e),O(t.A,e+"_unused_out")}function Kn(t){t.g.addBoolToStream(!0,"free_memory",t.B)}var nn=class{constructor(t){this.g=t,this.G=[],this.B=0,this.g.setAutoRenderToScreen(!1)}l(t,e=!0){var s,a,n,i,r,o;if(e){const l=t.baseOptions||{};if((s=t.baseOptions)!=null&&s.modelAssetBuffer&&((a=t.baseOptions)!=null&&a.modelAssetPath))throw Error("Cannot set both baseOptions.modelAssetPath and baseOptions.modelAssetBuffer");if(!((n=B(this.baseOptions,wn,1))!=null&&n.g()||(i=B(this.baseOptions,wn,1))!=null&&i.h()||(r=t.baseOptions)!=null&&r.modelAssetBuffer||(o=t.baseOptions)!=null&&o.modelAssetPath))throw Error("Either baseOptions.modelAssetPath or baseOptions.modelAssetBuffer must be set");if(function(d,c){let u=B(d.baseOptions,bl,3);if(!u){var f=u=new bl,p=new dl;ma(f,4,an,p)}"delegate"in c&&(c.delegate==="GPU"?(c=u,f=new vh,ma(c,2,an,f)):(c=u,f=new dl,ma(c,4,an,f))),C(d.baseOptions,0,3,u)}(this,l),l.modelAssetPath)return fetch(l.modelAssetPath.toString()).then(d=>{if(d.ok)return d.arrayBuffer();throw Error(`Failed to fetch model: ${l.modelAssetPath} (${d.status})`)}).then(d=>{try{this.g.i.FS_unlink("/model.dat")}catch{}this.g.i.FS_createDataFile("/","model.dat",new Uint8Array(d),!0,!1,!1),vi(this,"/model.dat"),this.m(),this.I()});if(l.modelAssetBuffer instanceof Uint8Array)vi(this,l.modelAssetBuffer);else if(l.modelAssetBuffer)return async function(d){const c=[];for(var u=0;;){const{done:f,value:p}=await d.read();if(f)break;c.push(p),u+=p.length}if(c.length===0)return new Uint8Array(0);if(c.length===1)return c[0];d=new Uint8Array(u),u=0;for(const f of c)d.set(f,u),u+=f.length;return d}(l.modelAssetBuffer).then(d=>{vi(this,d),this.m(),this.I()})}return this.m(),this.I(),Promise.resolve()}I(){}da(){let t;if(this.g.da(e=>{t=yh(e)}),!t)throw Error("Failed to retrieve CalculatorGraphConfig");return t}setGraph(t,e){this.g.attachErrorListener((s,a)=>{this.G.push(Error(a))}),this.g.La(),this.g.setGraph(t,e),this.A=void 0,kl(this)}finishProcessing(){this.g.finishProcessing(),kl(this)}close(){this.A=void 0,this.g.closeGraph()}};function Pt(t,e){if(!t)throw Error(`Unable to obtain required WebGL resource: ${e}`);return t}nn.prototype.close=nn.prototype.close,function(t,e){t=t.split(".");var s,a=ms;for((t[0]in a)||a.execScript===void 0||a.execScript("var "+t[0]);t.length&&(s=t.shift());)t.length||e===void 0?a=a[s]&&a[s]!==Object.prototype[s]?a[s]:a[s]={}:a[s]=e}("TaskRunner",nn);class zh{constructor(e,s,a,n){this.g=e,this.h=s,this.m=a,this.l=n}bind(){this.g.bindVertexArray(this.h)}close(){this.g.deleteVertexArray(this.h),this.g.deleteBuffer(this.m),this.g.deleteBuffer(this.l)}}function $l(t,e,s){const a=t.g;if(s=Pt(a.createShader(s),"Failed to create WebGL shader"),a.shaderSource(s,e),a.compileShader(s),!a.getShaderParameter(s,a.COMPILE_STATUS))throw Error(`Could not compile WebGL shader: ${a.getShaderInfoLog(s)}`);return a.attachShader(t.h,s),s}function El(t,e){const s=t.g,a=Pt(s.createVertexArray(),"Failed to create vertex array");s.bindVertexArray(a);const n=Pt(s.createBuffer(),"Failed to create buffer");s.bindBuffer(s.ARRAY_BUFFER,n),s.enableVertexAttribArray(t.O),s.vertexAttribPointer(t.O,2,s.FLOAT,!1,0,0),s.bufferData(s.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),s.STATIC_DRAW);const i=Pt(s.createBuffer(),"Failed to create buffer");return s.bindBuffer(s.ARRAY_BUFFER,i),s.enableVertexAttribArray(t.I),s.vertexAttribPointer(t.I,2,s.FLOAT,!1,0,0),s.bufferData(s.ARRAY_BUFFER,new Float32Array(e?[0,1,0,0,1,0,1,1]:[0,0,0,1,1,1,1,0]),s.STATIC_DRAW),s.bindBuffer(s.ARRAY_BUFFER,null),s.bindVertexArray(null),new zh(s,a,n,i)}function so(t,e){if(t.g){if(e!==t.g)throw Error("Cannot change GL context once initialized")}else t.g=e}function ao(t,e,s,a){return so(t,e),t.h||(t.m(),t.C()),s?(t.s||(t.s=El(t,!0)),s=t.s):(t.v||(t.v=El(t,!1)),s=t.v),e.useProgram(t.h),s.bind(),t.l(),t=a(),s.g.bindVertexArray(null),t}function Xn(t,e,s){return so(t,e),t=Pt(e.createTexture(),"Failed to create texture"),e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,s??e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,s??e.LINEAR),e.bindTexture(e.TEXTURE_2D,null),t}function Zn(t,e,s){so(t,e),t.A||(t.A=Pt(e.createFramebuffer(),"Failed to create framebuffe.")),e.bindFramebuffer(e.FRAMEBUFFER,t.A),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0)}function no(t){var e;(e=t.g)==null||e.bindFramebuffer(t.g.FRAMEBUFFER,null)}var io=class{G(){return`
  precision mediump float;
  varying vec2 vTex;
  uniform sampler2D inputTexture;
  void main() {
    gl_FragColor = texture2D(inputTexture, vTex);
  }
 `}m(){const t=this.g;if(this.h=Pt(t.createProgram(),"Failed to create WebGL program"),this.aa=$l(this,`
  attribute vec2 aVertex;
  attribute vec2 aTex;
  varying vec2 vTex;
  void main(void) {
    gl_Position = vec4(aVertex, 0.0, 1.0);
    vTex = aTex;
  }`,t.VERTEX_SHADER),this.Z=$l(this,this.G(),t.FRAGMENT_SHADER),t.linkProgram(this.h),!t.getProgramParameter(this.h,t.LINK_STATUS))throw Error(`Error during program linking: ${t.getProgramInfoLog(this.h)}`);this.O=t.getAttribLocation(this.h,"aVertex"),this.I=t.getAttribLocation(this.h,"aTex")}C(){}l(){}close(){if(this.h){const t=this.g;t.deleteProgram(this.h),t.deleteShader(this.aa),t.deleteShader(this.Z)}this.A&&this.g.deleteFramebuffer(this.A),this.v&&this.v.close(),this.s&&this.s.close()}};function Lt(t,e){switch(e){case 0:return t.g.find(s=>s instanceof Uint8Array);case 1:return t.g.find(s=>s instanceof Float32Array);case 2:return t.g.find(s=>typeof WebGLTexture<"u"&&s instanceof WebGLTexture);default:throw Error(`Type is not supported: ${e}`)}}function Qi(t){var e=Lt(t,1);if(!e){if(e=Lt(t,0))e=new Float32Array(e).map(a=>a/255);else{e=new Float32Array(t.width*t.height);const a=Ws(t);var s=ro(t);if(Zn(s,a,ou(t)),"iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"document"in self&&"ontouchend"in self.document){s=new Float32Array(t.width*t.height*4),a.readPixels(0,0,t.width,t.height,a.RGBA,a.FLOAT,s);for(let n=0,i=0;n<e.length;++n,i+=4)e[n]=s[i]}else a.readPixels(0,0,t.width,t.height,a.RED,a.FLOAT,e)}t.g.push(e)}return e}function ou(t){let e=Lt(t,2);if(!e){const s=Ws(t);e=du(t);const a=Qi(t),n=lu(t);s.texImage2D(s.TEXTURE_2D,0,n,t.width,t.height,0,s.RED,s.FLOAT,a),Yi(t)}return e}function Ws(t){if(!t.canvas)throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");return t.h||(t.h=Pt(t.canvas.getContext("webgl2"),"You cannot use a canvas that is already bound to a different type of rendering context.")),t.h}function lu(t){if(t=Ws(t),!Ua)if(t.getExtension("EXT_color_buffer_float")&&t.getExtension("OES_texture_float_linear")&&t.getExtension("EXT_float_blend"))Ua=t.R32F;else{if(!t.getExtension("EXT_color_buffer_half_float"))throw Error("GPU does not fully support 4-channel float32 or float16 formats");Ua=t.R16F}return Ua}function ro(t){return t.l||(t.l=new io),t.l}function du(t){const e=Ws(t);e.viewport(0,0,t.width,t.height),e.activeTexture(e.TEXTURE0);let s=Lt(t,2);return s||(s=Xn(ro(t),e,t.m?e.LINEAR:e.NEAREST),t.g.push(s),t.j=!0),e.bindTexture(e.TEXTURE_2D,s),s}function Yi(t){t.h.bindTexture(t.h.TEXTURE_2D,null)}var Ua,ge=class{constructor(t,e,s,a,n,i,r){this.g=t,this.m=e,this.j=s,this.canvas=a,this.l=n,this.width=i,this.height=r,this.j&&--Al===0&&console.error("You seem to be creating MPMask instances without invoking .close(). This leaks resources.")}Fa(){return!!Lt(this,0)}ja(){return!!Lt(this,1)}P(){return!!Lt(this,2)}ia(){return(e=Lt(t=this,0))||(e=Qi(t),e=new Uint8Array(e.map(s=>255*s)),t.g.push(e)),e;var t,e}ha(){return Qi(this)}M(){return ou(this)}clone(){const t=[];for(const e of this.g){let s;if(e instanceof Uint8Array)s=new Uint8Array(e);else if(e instanceof Float32Array)s=new Float32Array(e);else{if(!(e instanceof WebGLTexture))throw Error(`Type is not supported: ${e}`);{const a=Ws(this),n=ro(this);a.activeTexture(a.TEXTURE1),s=Xn(n,a,this.m?a.LINEAR:a.NEAREST),a.bindTexture(a.TEXTURE_2D,s);const i=lu(this);a.texImage2D(a.TEXTURE_2D,0,i,this.width,this.height,0,a.RED,a.FLOAT,null),a.bindTexture(a.TEXTURE_2D,null),Zn(n,a,s),ao(n,a,!1,()=>{du(this),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.drawArrays(a.TRIANGLE_FAN,0,4),Yi(this)}),no(n),Yi(this)}}t.push(s)}return new ge(t,this.m,this.P(),this.canvas,this.l,this.width,this.height)}close(){this.j&&Ws(this).deleteTexture(Lt(this,2)),Al=-1}};ge.prototype.close=ge.prototype.close,ge.prototype.clone=ge.prototype.clone,ge.prototype.getAsWebGLTexture=ge.prototype.M,ge.prototype.getAsFloat32Array=ge.prototype.ha,ge.prototype.getAsUint8Array=ge.prototype.ia,ge.prototype.hasWebGLTexture=ge.prototype.P,ge.prototype.hasFloat32Array=ge.prototype.ja,ge.prototype.hasUint8Array=ge.prototype.Fa;var Al=250;function wt(t,e){switch(e){case 0:return t.g.find(s=>s instanceof ImageData);case 1:return t.g.find(s=>typeof ImageBitmap<"u"&&s instanceof ImageBitmap);case 2:return t.g.find(s=>typeof WebGLTexture<"u"&&s instanceof WebGLTexture);default:throw Error(`Type is not supported: ${e}`)}}function cu(t){var e=wt(t,0);if(!e){e=zs(t);const s=ei(t),a=new Uint8Array(t.width*t.height*4);Zn(s,e,rn(t)),e.readPixels(0,0,t.width,t.height,e.RGBA,e.UNSIGNED_BYTE,a),no(s),e=new ImageData(new Uint8ClampedArray(a.buffer),t.width,t.height),t.g.push(e)}return e}function rn(t){let e=wt(t,2);if(!e){const s=zs(t);e=on(t);const a=wt(t,1)||cu(t);s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,a),pa(t)}return e}function zs(t){if(!t.canvas)throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");return t.h||(t.h=Pt(t.canvas.getContext("webgl2"),"You cannot use a canvas that is already bound to a different type of rendering context.")),t.h}function ei(t){return t.l||(t.l=new io),t.l}function on(t){const e=zs(t);e.viewport(0,0,t.width,t.height),e.activeTexture(e.TEXTURE0);let s=wt(t,2);return s||(s=Xn(ei(t),e),t.g.push(s),t.m=!0),e.bindTexture(e.TEXTURE_2D,s),s}function pa(t){t.h.bindTexture(t.h.TEXTURE_2D,null)}function Tl(t){const e=zs(t);return ao(ei(t),e,!0,()=>function(s,a){const n=s.canvas;if(n.width===s.width&&n.height===s.height)return a();const i=n.width,r=n.height;return n.width=s.width,n.height=s.height,s=a(),n.width=i,n.height=r,s}(t,()=>{if(e.bindFramebuffer(e.FRAMEBUFFER,null),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLE_FAN,0,4),!(t.canvas instanceof OffscreenCanvas))throw Error("Conversion to ImageBitmap requires that the MediaPipe Tasks is initialized with an OffscreenCanvas");return t.canvas.transferToImageBitmap()}))}var xe=class{constructor(t,e,s,a,n,i,r){this.g=t,this.j=e,this.m=s,this.canvas=a,this.l=n,this.width=i,this.height=r,(this.j||this.m)&&--Cl===0&&console.error("You seem to be creating MPImage instances without invoking .close(). This leaks resources.")}Ea(){return!!wt(this,0)}ka(){return!!wt(this,1)}P(){return!!wt(this,2)}Ca(){return cu(this)}Ba(){var t=wt(this,1);return t||(rn(this),on(this),t=Tl(this),pa(this),this.g.push(t),this.j=!0),t}M(){return rn(this)}clone(){const t=[];for(const e of this.g){let s;if(e instanceof ImageData)s=new ImageData(e.data,this.width,this.height);else if(e instanceof WebGLTexture){const a=zs(this),n=ei(this);a.activeTexture(a.TEXTURE1),s=Xn(n,a),a.bindTexture(a.TEXTURE_2D,s),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,this.width,this.height,0,a.RGBA,a.UNSIGNED_BYTE,null),a.bindTexture(a.TEXTURE_2D,null),Zn(n,a,s),ao(n,a,!1,()=>{on(this),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.drawArrays(a.TRIANGLE_FAN,0,4),pa(this)}),no(n),pa(this)}else{if(!(e instanceof ImageBitmap))throw Error(`Type is not supported: ${e}`);rn(this),on(this),s=Tl(this),pa(this)}t.push(s)}return new xe(t,this.ka(),this.P(),this.canvas,this.l,this.width,this.height)}close(){this.j&&wt(this,1).close(),this.m&&zs(this).deleteTexture(wt(this,2)),Cl=-1}};xe.prototype.close=xe.prototype.close,xe.prototype.clone=xe.prototype.clone,xe.prototype.getAsWebGLTexture=xe.prototype.M,xe.prototype.getAsImageBitmap=xe.prototype.Ba,xe.prototype.getAsImageData=xe.prototype.Ca,xe.prototype.hasWebGLTexture=xe.prototype.P,xe.prototype.hasImageBitmap=xe.prototype.ka,xe.prototype.hasImageData=xe.prototype.Ea;var Cl=250;function ft(...t){return t.map(([e,s])=>({start:e,end:s}))}const Jh=function(t){return class extends t{La(){this.i._registerModelResourcesGraphService()}}}((Ll=class{constructor(t,e){this.l=!0,this.i=t,this.g=null,this.h=0,this.m=typeof this.i._addIntToInputStream=="function",e!==void 0?this.i.canvas=e:iu()?this.i.canvas=new OffscreenCanvas(1,1):(console.warn("OffscreenCanvas not supported and GraphRunner constructor glCanvas parameter is undefined. Creating backup canvas."),this.i.canvas=document.createElement("canvas"))}async initializeGraph(t){const e=await(await fetch(t)).arrayBuffer();t=!(t.endsWith(".pbtxt")||t.endsWith(".textproto")),this.setGraph(new Uint8Array(e),t)}setGraphFromString(t){this.setGraph(new TextEncoder().encode(t),!1)}setGraph(t,e){const s=t.length,a=this.i._malloc(s);this.i.HEAPU8.set(t,a),e?this.i._changeBinaryGraph(s,a):this.i._changeTextGraph(s,a),this.i._free(a)}configureAudio(t,e,s,a,n){this.i._configureAudio||console.warn('Attempting to use configureAudio without support for input audio. Is build dep ":gl_graph_runner_audio" missing?'),E(this,a||"input_audio",i=>{E(this,n=n||"audio_header",r=>{this.i._configureAudio(i,r,t,e??0,s)})})}setAutoResizeCanvas(t){this.l=t}setAutoRenderToScreen(t){this.i._setAutoRenderToScreen(t)}setGpuBufferVerticalFlip(t){this.i.gpuOriginForWebTexturesIsBottomLeft=t}da(t){mt(this,"__graph_config__",e=>{t(e)}),E(this,"__graph_config__",e=>{this.i._getGraphConfig(e,void 0)}),delete this.i.simpleListeners.__graph_config__}attachErrorListener(t){this.i.errorListener=t}attachEmptyPacketListener(t,e){this.i.emptyPacketListeners=this.i.emptyPacketListeners||{},this.i.emptyPacketListeners[t]=e}addAudioToStream(t,e,s){this.addAudioToStreamWithShape(t,0,0,e,s)}addAudioToStreamWithShape(t,e,s,a,n){const i=4*t.length;this.h!==i&&(this.g&&this.i._free(this.g),this.g=this.i._malloc(i),this.h=i),this.i.HEAPF32.set(t,this.g/4),E(this,a,r=>{this.i._addAudioToInputStream(this.g,e,s,r,n)})}addGpuBufferToStream(t,e,s){E(this,e,a=>{const[n,i]=wl(this,t,a);this.i._addBoundTextureToStream(a,n,i,s)})}addBoolToStream(t,e,s){E(this,e,a=>{this.i._addBoolToInputStream(t,a,s)})}addDoubleToStream(t,e,s){E(this,e,a=>{this.i._addDoubleToInputStream(t,a,s)})}addFloatToStream(t,e,s){E(this,e,a=>{this.i._addFloatToInputStream(t,a,s)})}addIntToStream(t,e,s){E(this,e,a=>{this.i._addIntToInputStream(t,a,s)})}addUintToStream(t,e,s){E(this,e,a=>{this.i._addUintToInputStream(t,a,s)})}addStringToStream(t,e,s){E(this,e,a=>{E(this,t,n=>{this.i._addStringToInputStream(n,a,s)})})}addStringRecordToStream(t,e,s){E(this,e,a=>{Sl(this,Object.keys(t),n=>{Sl(this,Object.values(t),i=>{this.i._addFlatHashMapToInputStream(n,i,Object.keys(t).length,a,s)})})})}addProtoToStream(t,e,s,a){E(this,s,n=>{E(this,e,i=>{const r=this.i._malloc(t.length);this.i.HEAPU8.set(t,r),this.i._addProtoToInputStream(r,t.length,i,n,a),this.i._free(r)})})}addEmptyPacketToStream(t,e){E(this,t,s=>{this.i._addEmptyPacketToInputStream(s,e)})}addBoolVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateBoolVector(t.length);if(!n)throw Error("Unable to allocate new bool vector on heap.");for(const i of t)this.i._addBoolVectorEntry(n,i);this.i._addBoolVectorToInputStream(n,a,s)})}addDoubleVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateDoubleVector(t.length);if(!n)throw Error("Unable to allocate new double vector on heap.");for(const i of t)this.i._addDoubleVectorEntry(n,i);this.i._addDoubleVectorToInputStream(n,a,s)})}addFloatVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateFloatVector(t.length);if(!n)throw Error("Unable to allocate new float vector on heap.");for(const i of t)this.i._addFloatVectorEntry(n,i);this.i._addFloatVectorToInputStream(n,a,s)})}addIntVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateIntVector(t.length);if(!n)throw Error("Unable to allocate new int vector on heap.");for(const i of t)this.i._addIntVectorEntry(n,i);this.i._addIntVectorToInputStream(n,a,s)})}addUintVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateUintVector(t.length);if(!n)throw Error("Unable to allocate new unsigned int vector on heap.");for(const i of t)this.i._addUintVectorEntry(n,i);this.i._addUintVectorToInputStream(n,a,s)})}addStringVectorToStream(t,e,s){E(this,e,a=>{const n=this.i._allocateStringVector(t.length);if(!n)throw Error("Unable to allocate new string vector on heap.");for(const i of t)E(this,i,r=>{this.i._addStringVectorEntry(n,r)});this.i._addStringVectorToInputStream(n,a,s)})}addBoolToInputSidePacket(t,e){E(this,e,s=>{this.i._addBoolToInputSidePacket(t,s)})}addDoubleToInputSidePacket(t,e){E(this,e,s=>{this.i._addDoubleToInputSidePacket(t,s)})}addFloatToInputSidePacket(t,e){E(this,e,s=>{this.i._addFloatToInputSidePacket(t,s)})}addIntToInputSidePacket(t,e){E(this,e,s=>{this.i._addIntToInputSidePacket(t,s)})}addUintToInputSidePacket(t,e){E(this,e,s=>{this.i._addUintToInputSidePacket(t,s)})}addStringToInputSidePacket(t,e){E(this,e,s=>{E(this,t,a=>{this.i._addStringToInputSidePacket(a,s)})})}addProtoToInputSidePacket(t,e,s){E(this,s,a=>{E(this,e,n=>{const i=this.i._malloc(t.length);this.i.HEAPU8.set(t,i),this.i._addProtoToInputSidePacket(i,t.length,n,a),this.i._free(i)})})}addBoolVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateBoolVector(t.length);if(!a)throw Error("Unable to allocate new bool vector on heap.");for(const n of t)this.i._addBoolVectorEntry(a,n);this.i._addBoolVectorToInputSidePacket(a,s)})}addDoubleVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateDoubleVector(t.length);if(!a)throw Error("Unable to allocate new double vector on heap.");for(const n of t)this.i._addDoubleVectorEntry(a,n);this.i._addDoubleVectorToInputSidePacket(a,s)})}addFloatVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateFloatVector(t.length);if(!a)throw Error("Unable to allocate new float vector on heap.");for(const n of t)this.i._addFloatVectorEntry(a,n);this.i._addFloatVectorToInputSidePacket(a,s)})}addIntVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateIntVector(t.length);if(!a)throw Error("Unable to allocate new int vector on heap.");for(const n of t)this.i._addIntVectorEntry(a,n);this.i._addIntVectorToInputSidePacket(a,s)})}addUintVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateUintVector(t.length);if(!a)throw Error("Unable to allocate new unsigned int vector on heap.");for(const n of t)this.i._addUintVectorEntry(a,n);this.i._addUintVectorToInputSidePacket(a,s)})}addStringVectorToInputSidePacket(t,e){E(this,e,s=>{const a=this.i._allocateStringVector(t.length);if(!a)throw Error("Unable to allocate new string vector on heap.");for(const n of t)E(this,n,i=>{this.i._addStringVectorEntry(a,i)});this.i._addStringVectorToInputSidePacket(a,s)})}attachBoolListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachBoolListener(s)})}attachBoolVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachBoolVectorListener(s)})}attachIntListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachIntListener(s)})}attachIntVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachIntVectorListener(s)})}attachUintListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachUintListener(s)})}attachUintVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachUintVectorListener(s)})}attachDoubleListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachDoubleListener(s)})}attachDoubleVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachDoubleVectorListener(s)})}attachFloatListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachFloatListener(s)})}attachFloatVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachFloatVectorListener(s)})}attachStringListener(t,e){mt(this,t,e),E(this,t,s=>{this.i._attachStringListener(s)})}attachStringVectorListener(t,e){Ut(this,t,e),E(this,t,s=>{this.i._attachStringVectorListener(s)})}attachProtoListener(t,e,s){mt(this,t,e),E(this,t,a=>{this.i._attachProtoListener(a,s||!1)})}attachProtoVectorListener(t,e,s){Ut(this,t,e),E(this,t,a=>{this.i._attachProtoVectorListener(a,s||!1)})}attachAudioListener(t,e,s){this.i._attachAudioListener||console.warn('Attempting to use attachAudioListener without support for output audio. Is build dep ":gl_graph_runner_audio_out" missing?'),mt(this,t,(a,n)=>{a=new Float32Array(a.buffer,a.byteOffset,a.length/4),e(a,n)}),E(this,t,a=>{this.i._attachAudioListener(a,s||!1)})}finishProcessing(){this.i._waitUntilIdle()}closeGraph(){this.i._closeGraph(),this.i.simpleListeners=void 0,this.i.emptyPacketListeners=void 0}},class extends Ll{get ea(){return this.i}qa(t,e,s){E(this,e,a=>{const[n,i]=wl(this,t,a);this.ea._addBoundTextureAsImageToStream(a,n,i,s)})}U(t,e){mt(this,t,e),E(this,t,s=>{this.ea._attachImageListener(s)})}ca(t,e){Ut(this,t,e),E(this,t,s=>{this.ea._attachImageVectorListener(s)})}}));var Ll,rt=class extends Jh{};async function D(t,e,s){return async function(a,n,i,r){return Wh(a,n,i,r)}(t,s.canvas??(iu()?void 0:document.createElement("canvas")),e,s)}function uu(t,e,s,a){if(t.T){const i=new jc;if(s!=null&&s.regionOfInterest){if(!t.pa)throw Error("This task doesn't support region-of-interest.");var n=s.regionOfInterest;if(n.left>=n.right||n.top>=n.bottom)throw Error("Expected RectF with left < right and top < bottom.");if(n.left<0||n.top<0||n.right>1||n.bottom>1)throw Error("Expected RectF values to be in [0,1].");$(i,1,(n.left+n.right)/2),$(i,2,(n.top+n.bottom)/2),$(i,4,n.right-n.left),$(i,3,n.bottom-n.top)}else $(i,1,.5),$(i,2,.5),$(i,4,1),$(i,3,1);if(s!=null&&s.rotationDegrees){if((s==null?void 0:s.rotationDegrees)%90!=0)throw Error("Expected rotation to be a multiple of 90°.");if($(i,5,-Math.PI*s.rotationDegrees/180),(s==null?void 0:s.rotationDegrees)%180!=0){const[r,o]=ru(e);s=de(i,3)*o/r,n=de(i,4)*r/o,$(i,4,s),$(i,3,n)}}t.g.addProtoToStream(i.g(),"mediapipe.NormalizedRect",t.T,a)}t.g.qa(e,t.aa,a??performance.now()),t.finishProcessing()}function ot(t,e,s){var a;if((a=t.baseOptions)!=null&&a.g())throw Error("Task is not initialized with image mode. 'runningMode' must be set to 'IMAGE'.");uu(t,e,s,t.B+1)}function kt(t,e,s,a){var n;if(!((n=t.baseOptions)!=null&&n.g()))throw Error("Task is not initialized with video mode. 'runningMode' must be set to 'VIDEO'.");uu(t,e,s,a)}function Js(t,e,s,a){var n=e.data;const i=e.width,r=i*(e=e.height);if((n instanceof Uint8Array||n instanceof Float32Array)&&n.length!==r)throw Error("Unsupported channel count: "+n.length/r);return t=new ge([n],s,!1,t.g.i.canvas,t.O,i,e),a?t.clone():t}var je=class extends nn{constructor(t,e,s,a){super(t),this.g=t,this.aa=e,this.T=s,this.pa=a,this.O=new io}l(t,e=!0){if("runningMode"in t&&Aa(this.baseOptions,2,!!t.runningMode&&t.runningMode!=="IMAGE"),t.canvas!==void 0&&this.g.i.canvas!==t.canvas)throw Error("You must create a new task to reset the canvas.");return super.l(t,e)}close(){this.O.close(),super.close()}};je.prototype.close=je.prototype.close;var _e=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect_in",!1),this.j={detections:[]},C(t=this.h=new Jn,0,1,e=new ne),$(this.h,2,.5),$(this.h,3,.3)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return"minDetectionConfidence"in t&&$(this.h,2,t.minDetectionConfidence??.5),"minSuppressionThreshold"in t&&$(this.h,3,t.minSuppressionThreshold??.3),this.l(t)}D(t,e){return this.j={detections:[]},ot(this,t,e),this.j}F(t,e,s){return this.j={detections:[]},kt(this,t,s,e),this.j}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect_in"),U(t,"detections");const e=new We;ut(e,Mh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.face_detector.FaceDetectorGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect_in"),O(s,"DETECTIONS:detections"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("detections",(a,n)=>{for(const i of a)a=Ic(i),this.j.detections.push(au(a));v(this,n)}),this.g.attachEmptyPacketListener("detections",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};_e.prototype.detectForVideo=_e.prototype.F,_e.prototype.detect=_e.prototype.D,_e.prototype.setOptions=_e.prototype.o,_e.createFromModelPath=async function(t,e){return D(_e,t,{baseOptions:{modelAssetPath:e}})},_e.createFromModelBuffer=function(t,e){return D(_e,t,{baseOptions:{modelAssetBuffer:e}})},_e.createFromOptions=function(t,e){return D(_e,t,e)};var oo=ft([61,146],[146,91],[91,181],[181,84],[84,17],[17,314],[314,405],[405,321],[321,375],[375,291],[61,185],[185,40],[40,39],[39,37],[37,0],[0,267],[267,269],[269,270],[270,409],[409,291],[78,95],[95,88],[88,178],[178,87],[87,14],[14,317],[317,402],[402,318],[318,324],[324,308],[78,191],[191,80],[80,81],[81,82],[82,13],[13,312],[312,311],[311,310],[310,415],[415,308]),lo=ft([263,249],[249,390],[390,373],[373,374],[374,380],[380,381],[381,382],[382,362],[263,466],[466,388],[388,387],[387,386],[386,385],[385,384],[384,398],[398,362]),co=ft([276,283],[283,282],[282,295],[295,285],[300,293],[293,334],[334,296],[296,336]),pu=ft([474,475],[475,476],[476,477],[477,474]),uo=ft([33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],[33,246],[246,161],[161,160],[160,159],[159,158],[158,157],[157,173],[173,133]),po=ft([46,53],[53,52],[52,65],[65,55],[70,63],[63,105],[105,66],[66,107]),hu=ft([469,470],[470,471],[471,472],[472,469]),ho=ft([10,338],[338,297],[297,332],[332,284],[284,251],[251,389],[389,356],[356,454],[454,323],[323,361],[361,288],[288,397],[397,365],[365,379],[379,378],[378,400],[400,377],[377,152],[152,148],[148,176],[176,149],[149,150],[150,136],[136,172],[172,58],[58,132],[132,93],[93,234],[234,127],[127,162],[162,21],[21,54],[54,103],[103,67],[67,109],[109,10]),fu=[...oo,...lo,...co,...uo,...po,...ho],bu=ft([127,34],[34,139],[139,127],[11,0],[0,37],[37,11],[232,231],[231,120],[120,232],[72,37],[37,39],[39,72],[128,121],[121,47],[47,128],[232,121],[121,128],[128,232],[104,69],[69,67],[67,104],[175,171],[171,148],[148,175],[118,50],[50,101],[101,118],[73,39],[39,40],[40,73],[9,151],[151,108],[108,9],[48,115],[115,131],[131,48],[194,204],[204,211],[211,194],[74,40],[40,185],[185,74],[80,42],[42,183],[183,80],[40,92],[92,186],[186,40],[230,229],[229,118],[118,230],[202,212],[212,214],[214,202],[83,18],[18,17],[17,83],[76,61],[61,146],[146,76],[160,29],[29,30],[30,160],[56,157],[157,173],[173,56],[106,204],[204,194],[194,106],[135,214],[214,192],[192,135],[203,165],[165,98],[98,203],[21,71],[71,68],[68,21],[51,45],[45,4],[4,51],[144,24],[24,23],[23,144],[77,146],[146,91],[91,77],[205,50],[50,187],[187,205],[201,200],[200,18],[18,201],[91,106],[106,182],[182,91],[90,91],[91,181],[181,90],[85,84],[84,17],[17,85],[206,203],[203,36],[36,206],[148,171],[171,140],[140,148],[92,40],[40,39],[39,92],[193,189],[189,244],[244,193],[159,158],[158,28],[28,159],[247,246],[246,161],[161,247],[236,3],[3,196],[196,236],[54,68],[68,104],[104,54],[193,168],[168,8],[8,193],[117,228],[228,31],[31,117],[189,193],[193,55],[55,189],[98,97],[97,99],[99,98],[126,47],[47,100],[100,126],[166,79],[79,218],[218,166],[155,154],[154,26],[26,155],[209,49],[49,131],[131,209],[135,136],[136,150],[150,135],[47,126],[126,217],[217,47],[223,52],[52,53],[53,223],[45,51],[51,134],[134,45],[211,170],[170,140],[140,211],[67,69],[69,108],[108,67],[43,106],[106,91],[91,43],[230,119],[119,120],[120,230],[226,130],[130,247],[247,226],[63,53],[53,52],[52,63],[238,20],[20,242],[242,238],[46,70],[70,156],[156,46],[78,62],[62,96],[96,78],[46,53],[53,63],[63,46],[143,34],[34,227],[227,143],[123,117],[117,111],[111,123],[44,125],[125,19],[19,44],[236,134],[134,51],[51,236],[216,206],[206,205],[205,216],[154,153],[153,22],[22,154],[39,37],[37,167],[167,39],[200,201],[201,208],[208,200],[36,142],[142,100],[100,36],[57,212],[212,202],[202,57],[20,60],[60,99],[99,20],[28,158],[158,157],[157,28],[35,226],[226,113],[113,35],[160,159],[159,27],[27,160],[204,202],[202,210],[210,204],[113,225],[225,46],[46,113],[43,202],[202,204],[204,43],[62,76],[76,77],[77,62],[137,123],[123,116],[116,137],[41,38],[38,72],[72,41],[203,129],[129,142],[142,203],[64,98],[98,240],[240,64],[49,102],[102,64],[64,49],[41,73],[73,74],[74,41],[212,216],[216,207],[207,212],[42,74],[74,184],[184,42],[169,170],[170,211],[211,169],[170,149],[149,176],[176,170],[105,66],[66,69],[69,105],[122,6],[6,168],[168,122],[123,147],[147,187],[187,123],[96,77],[77,90],[90,96],[65,55],[55,107],[107,65],[89,90],[90,180],[180,89],[101,100],[100,120],[120,101],[63,105],[105,104],[104,63],[93,137],[137,227],[227,93],[15,86],[86,85],[85,15],[129,102],[102,49],[49,129],[14,87],[87,86],[86,14],[55,8],[8,9],[9,55],[100,47],[47,121],[121,100],[145,23],[23,22],[22,145],[88,89],[89,179],[179,88],[6,122],[122,196],[196,6],[88,95],[95,96],[96,88],[138,172],[172,136],[136,138],[215,58],[58,172],[172,215],[115,48],[48,219],[219,115],[42,80],[80,81],[81,42],[195,3],[3,51],[51,195],[43,146],[146,61],[61,43],[171,175],[175,199],[199,171],[81,82],[82,38],[38,81],[53,46],[46,225],[225,53],[144,163],[163,110],[110,144],[52,65],[65,66],[66,52],[229,228],[228,117],[117,229],[34,127],[127,234],[234,34],[107,108],[108,69],[69,107],[109,108],[108,151],[151,109],[48,64],[64,235],[235,48],[62,78],[78,191],[191,62],[129,209],[209,126],[126,129],[111,35],[35,143],[143,111],[117,123],[123,50],[50,117],[222,65],[65,52],[52,222],[19,125],[125,141],[141,19],[221,55],[55,65],[65,221],[3,195],[195,197],[197,3],[25,7],[7,33],[33,25],[220,237],[237,44],[44,220],[70,71],[71,139],[139,70],[122,193],[193,245],[245,122],[247,130],[130,33],[33,247],[71,21],[21,162],[162,71],[170,169],[169,150],[150,170],[188,174],[174,196],[196,188],[216,186],[186,92],[92,216],[2,97],[97,167],[167,2],[141,125],[125,241],[241,141],[164,167],[167,37],[37,164],[72,38],[38,12],[12,72],[38,82],[82,13],[13,38],[63,68],[68,71],[71,63],[226,35],[35,111],[111,226],[101,50],[50,205],[205,101],[206,92],[92,165],[165,206],[209,198],[198,217],[217,209],[165,167],[167,97],[97,165],[220,115],[115,218],[218,220],[133,112],[112,243],[243,133],[239,238],[238,241],[241,239],[214,135],[135,169],[169,214],[190,173],[173,133],[133,190],[171,208],[208,32],[32,171],[125,44],[44,237],[237,125],[86,87],[87,178],[178,86],[85,86],[86,179],[179,85],[84,85],[85,180],[180,84],[83,84],[84,181],[181,83],[201,83],[83,182],[182,201],[137,93],[93,132],[132,137],[76,62],[62,183],[183,76],[61,76],[76,184],[184,61],[57,61],[61,185],[185,57],[212,57],[57,186],[186,212],[214,207],[207,187],[187,214],[34,143],[143,156],[156,34],[79,239],[239,237],[237,79],[123,137],[137,177],[177,123],[44,1],[1,4],[4,44],[201,194],[194,32],[32,201],[64,102],[102,129],[129,64],[213,215],[215,138],[138,213],[59,166],[166,219],[219,59],[242,99],[99,97],[97,242],[2,94],[94,141],[141,2],[75,59],[59,235],[235,75],[24,110],[110,228],[228,24],[25,130],[130,226],[226,25],[23,24],[24,229],[229,23],[22,23],[23,230],[230,22],[26,22],[22,231],[231,26],[112,26],[26,232],[232,112],[189,190],[190,243],[243,189],[221,56],[56,190],[190,221],[28,56],[56,221],[221,28],[27,28],[28,222],[222,27],[29,27],[27,223],[223,29],[30,29],[29,224],[224,30],[247,30],[30,225],[225,247],[238,79],[79,20],[20,238],[166,59],[59,75],[75,166],[60,75],[75,240],[240,60],[147,177],[177,215],[215,147],[20,79],[79,166],[166,20],[187,147],[147,213],[213,187],[112,233],[233,244],[244,112],[233,128],[128,245],[245,233],[128,114],[114,188],[188,128],[114,217],[217,174],[174,114],[131,115],[115,220],[220,131],[217,198],[198,236],[236,217],[198,131],[131,134],[134,198],[177,132],[132,58],[58,177],[143,35],[35,124],[124,143],[110,163],[163,7],[7,110],[228,110],[110,25],[25,228],[356,389],[389,368],[368,356],[11,302],[302,267],[267,11],[452,350],[350,349],[349,452],[302,303],[303,269],[269,302],[357,343],[343,277],[277,357],[452,453],[453,357],[357,452],[333,332],[332,297],[297,333],[175,152],[152,377],[377,175],[347,348],[348,330],[330,347],[303,304],[304,270],[270,303],[9,336],[336,337],[337,9],[278,279],[279,360],[360,278],[418,262],[262,431],[431,418],[304,408],[408,409],[409,304],[310,415],[415,407],[407,310],[270,409],[409,410],[410,270],[450,348],[348,347],[347,450],[422,430],[430,434],[434,422],[313,314],[314,17],[17,313],[306,307],[307,375],[375,306],[387,388],[388,260],[260,387],[286,414],[414,398],[398,286],[335,406],[406,418],[418,335],[364,367],[367,416],[416,364],[423,358],[358,327],[327,423],[251,284],[284,298],[298,251],[281,5],[5,4],[4,281],[373,374],[374,253],[253,373],[307,320],[320,321],[321,307],[425,427],[427,411],[411,425],[421,313],[313,18],[18,421],[321,405],[405,406],[406,321],[320,404],[404,405],[405,320],[315,16],[16,17],[17,315],[426,425],[425,266],[266,426],[377,400],[400,369],[369,377],[322,391],[391,269],[269,322],[417,465],[465,464],[464,417],[386,257],[257,258],[258,386],[466,260],[260,388],[388,466],[456,399],[399,419],[419,456],[284,332],[332,333],[333,284],[417,285],[285,8],[8,417],[346,340],[340,261],[261,346],[413,441],[441,285],[285,413],[327,460],[460,328],[328,327],[355,371],[371,329],[329,355],[392,439],[439,438],[438,392],[382,341],[341,256],[256,382],[429,420],[420,360],[360,429],[364,394],[394,379],[379,364],[277,343],[343,437],[437,277],[443,444],[444,283],[283,443],[275,440],[440,363],[363,275],[431,262],[262,369],[369,431],[297,338],[338,337],[337,297],[273,375],[375,321],[321,273],[450,451],[451,349],[349,450],[446,342],[342,467],[467,446],[293,334],[334,282],[282,293],[458,461],[461,462],[462,458],[276,353],[353,383],[383,276],[308,324],[324,325],[325,308],[276,300],[300,293],[293,276],[372,345],[345,447],[447,372],[352,345],[345,340],[340,352],[274,1],[1,19],[19,274],[456,248],[248,281],[281,456],[436,427],[427,425],[425,436],[381,256],[256,252],[252,381],[269,391],[391,393],[393,269],[200,199],[199,428],[428,200],[266,330],[330,329],[329,266],[287,273],[273,422],[422,287],[250,462],[462,328],[328,250],[258,286],[286,384],[384,258],[265,353],[353,342],[342,265],[387,259],[259,257],[257,387],[424,431],[431,430],[430,424],[342,353],[353,276],[276,342],[273,335],[335,424],[424,273],[292,325],[325,307],[307,292],[366,447],[447,345],[345,366],[271,303],[303,302],[302,271],[423,266],[266,371],[371,423],[294,455],[455,460],[460,294],[279,278],[278,294],[294,279],[271,272],[272,304],[304,271],[432,434],[434,427],[427,432],[272,407],[407,408],[408,272],[394,430],[430,431],[431,394],[395,369],[369,400],[400,395],[334,333],[333,299],[299,334],[351,417],[417,168],[168,351],[352,280],[280,411],[411,352],[325,319],[319,320],[320,325],[295,296],[296,336],[336,295],[319,403],[403,404],[404,319],[330,348],[348,349],[349,330],[293,298],[298,333],[333,293],[323,454],[454,447],[447,323],[15,16],[16,315],[315,15],[358,429],[429,279],[279,358],[14,15],[15,316],[316,14],[285,336],[336,9],[9,285],[329,349],[349,350],[350,329],[374,380],[380,252],[252,374],[318,402],[402,403],[403,318],[6,197],[197,419],[419,6],[318,319],[319,325],[325,318],[367,364],[364,365],[365,367],[435,367],[367,397],[397,435],[344,438],[438,439],[439,344],[272,271],[271,311],[311,272],[195,5],[5,281],[281,195],[273,287],[287,291],[291,273],[396,428],[428,199],[199,396],[311,271],[271,268],[268,311],[283,444],[444,445],[445,283],[373,254],[254,339],[339,373],[282,334],[334,296],[296,282],[449,347],[347,346],[346,449],[264,447],[447,454],[454,264],[336,296],[296,299],[299,336],[338,10],[10,151],[151,338],[278,439],[439,455],[455,278],[292,407],[407,415],[415,292],[358,371],[371,355],[355,358],[340,345],[345,372],[372,340],[346,347],[347,280],[280,346],[442,443],[443,282],[282,442],[19,94],[94,370],[370,19],[441,442],[442,295],[295,441],[248,419],[419,197],[197,248],[263,255],[255,359],[359,263],[440,275],[275,274],[274,440],[300,383],[383,368],[368,300],[351,412],[412,465],[465,351],[263,467],[467,466],[466,263],[301,368],[368,389],[389,301],[395,378],[378,379],[379,395],[412,351],[351,419],[419,412],[436,426],[426,322],[322,436],[2,164],[164,393],[393,2],[370,462],[462,461],[461,370],[164,0],[0,267],[267,164],[302,11],[11,12],[12,302],[268,12],[12,13],[13,268],[293,300],[300,301],[301,293],[446,261],[261,340],[340,446],[330,266],[266,425],[425,330],[426,423],[423,391],[391,426],[429,355],[355,437],[437,429],[391,327],[327,326],[326,391],[440,457],[457,438],[438,440],[341,382],[382,362],[362,341],[459,457],[457,461],[461,459],[434,430],[430,394],[394,434],[414,463],[463,362],[362,414],[396,369],[369,262],[262,396],[354,461],[461,457],[457,354],[316,403],[403,402],[402,316],[315,404],[404,403],[403,315],[314,405],[405,404],[404,314],[313,406],[406,405],[405,313],[421,418],[418,406],[406,421],[366,401],[401,361],[361,366],[306,408],[408,407],[407,306],[291,409],[409,408],[408,291],[287,410],[410,409],[409,287],[432,436],[436,410],[410,432],[434,416],[416,411],[411,434],[264,368],[368,383],[383,264],[309,438],[438,457],[457,309],[352,376],[376,401],[401,352],[274,275],[275,4],[4,274],[421,428],[428,262],[262,421],[294,327],[327,358],[358,294],[433,416],[416,367],[367,433],[289,455],[455,439],[439,289],[462,370],[370,326],[326,462],[2,326],[326,370],[370,2],[305,460],[460,455],[455,305],[254,449],[449,448],[448,254],[255,261],[261,446],[446,255],[253,450],[450,449],[449,253],[252,451],[451,450],[450,252],[256,452],[452,451],[451,256],[341,453],[453,452],[452,341],[413,464],[464,463],[463,413],[441,413],[413,414],[414,441],[258,442],[442,441],[441,258],[257,443],[443,442],[442,257],[259,444],[444,443],[443,259],[260,445],[445,444],[444,260],[467,342],[342,445],[445,467],[459,458],[458,250],[250,459],[289,392],[392,290],[290,289],[290,328],[328,460],[460,290],[376,433],[433,435],[435,376],[250,290],[290,392],[392,250],[411,416],[416,433],[433,411],[341,463],[463,464],[464,341],[453,464],[464,465],[465,453],[357,465],[465,412],[412,357],[343,412],[412,399],[399,343],[360,363],[363,440],[440,360],[437,399],[399,456],[456,437],[420,456],[456,363],[363,420],[401,435],[435,288],[288,401],[372,383],[383,353],[353,372],[339,255],[255,249],[249,339],[448,261],[261,255],[255,448],[133,243],[243,190],[190,133],[133,155],[155,112],[112,133],[33,246],[246,247],[247,33],[33,130],[130,25],[25,33],[398,384],[384,286],[286,398],[362,398],[398,414],[414,362],[362,463],[463,341],[341,362],[263,359],[359,467],[467,263],[263,249],[249,255],[255,263],[466,467],[467,260],[260,466],[75,60],[60,166],[166,75],[238,239],[239,79],[79,238],[162,127],[127,139],[139,162],[72,11],[11,37],[37,72],[121,232],[232,120],[120,121],[73,72],[72,39],[39,73],[114,128],[128,47],[47,114],[233,232],[232,128],[128,233],[103,104],[104,67],[67,103],[152,175],[175,148],[148,152],[119,118],[118,101],[101,119],[74,73],[73,40],[40,74],[107,9],[9,108],[108,107],[49,48],[48,131],[131,49],[32,194],[194,211],[211,32],[184,74],[74,185],[185,184],[191,80],[80,183],[183,191],[185,40],[40,186],[186,185],[119,230],[230,118],[118,119],[210,202],[202,214],[214,210],[84,83],[83,17],[17,84],[77,76],[76,146],[146,77],[161,160],[160,30],[30,161],[190,56],[56,173],[173,190],[182,106],[106,194],[194,182],[138,135],[135,192],[192,138],[129,203],[203,98],[98,129],[54,21],[21,68],[68,54],[5,51],[51,4],[4,5],[145,144],[144,23],[23,145],[90,77],[77,91],[91,90],[207,205],[205,187],[187,207],[83,201],[201,18],[18,83],[181,91],[91,182],[182,181],[180,90],[90,181],[181,180],[16,85],[85,17],[17,16],[205,206],[206,36],[36,205],[176,148],[148,140],[140,176],[165,92],[92,39],[39,165],[245,193],[193,244],[244,245],[27,159],[159,28],[28,27],[30,247],[247,161],[161,30],[174,236],[236,196],[196,174],[103,54],[54,104],[104,103],[55,193],[193,8],[8,55],[111,117],[117,31],[31,111],[221,189],[189,55],[55,221],[240,98],[98,99],[99,240],[142,126],[126,100],[100,142],[219,166],[166,218],[218,219],[112,155],[155,26],[26,112],[198,209],[209,131],[131,198],[169,135],[135,150],[150,169],[114,47],[47,217],[217,114],[224,223],[223,53],[53,224],[220,45],[45,134],[134,220],[32,211],[211,140],[140,32],[109,67],[67,108],[108,109],[146,43],[43,91],[91,146],[231,230],[230,120],[120,231],[113,226],[226,247],[247,113],[105,63],[63,52],[52,105],[241,238],[238,242],[242,241],[124,46],[46,156],[156,124],[95,78],[78,96],[96,95],[70,46],[46,63],[63,70],[116,143],[143,227],[227,116],[116,123],[123,111],[111,116],[1,44],[44,19],[19,1],[3,236],[236,51],[51,3],[207,216],[216,205],[205,207],[26,154],[154,22],[22,26],[165,39],[39,167],[167,165],[199,200],[200,208],[208,199],[101,36],[36,100],[100,101],[43,57],[57,202],[202,43],[242,20],[20,99],[99,242],[56,28],[28,157],[157,56],[124,35],[35,113],[113,124],[29,160],[160,27],[27,29],[211,204],[204,210],[210,211],[124,113],[113,46],[46,124],[106,43],[43,204],[204,106],[96,62],[62,77],[77,96],[227,137],[137,116],[116,227],[73,41],[41,72],[72,73],[36,203],[203,142],[142,36],[235,64],[64,240],[240,235],[48,49],[49,64],[64,48],[42,41],[41,74],[74,42],[214,212],[212,207],[207,214],[183,42],[42,184],[184,183],[210,169],[169,211],[211,210],[140,170],[170,176],[176,140],[104,105],[105,69],[69,104],[193,122],[122,168],[168,193],[50,123],[123,187],[187,50],[89,96],[96,90],[90,89],[66,65],[65,107],[107,66],[179,89],[89,180],[180,179],[119,101],[101,120],[120,119],[68,63],[63,104],[104,68],[234,93],[93,227],[227,234],[16,15],[15,85],[85,16],[209,129],[129,49],[49,209],[15,14],[14,86],[86,15],[107,55],[55,9],[9,107],[120,100],[100,121],[121,120],[153,145],[145,22],[22,153],[178,88],[88,179],[179,178],[197,6],[6,196],[196,197],[89,88],[88,96],[96,89],[135,138],[138,136],[136,135],[138,215],[215,172],[172,138],[218,115],[115,219],[219,218],[41,42],[42,81],[81,41],[5,195],[195,51],[51,5],[57,43],[43,61],[61,57],[208,171],[171,199],[199,208],[41,81],[81,38],[38,41],[224,53],[53,225],[225,224],[24,144],[144,110],[110,24],[105,52],[52,66],[66,105],[118,229],[229,117],[117,118],[227,34],[34,234],[234,227],[66,107],[107,69],[69,66],[10,109],[109,151],[151,10],[219,48],[48,235],[235,219],[183,62],[62,191],[191,183],[142,129],[129,126],[126,142],[116,111],[111,143],[143,116],[118,117],[117,50],[50,118],[223,222],[222,52],[52,223],[94,19],[19,141],[141,94],[222,221],[221,65],[65,222],[196,3],[3,197],[197,196],[45,220],[220,44],[44,45],[156,70],[70,139],[139,156],[188,122],[122,245],[245,188],[139,71],[71,162],[162,139],[149,170],[170,150],[150,149],[122,188],[188,196],[196,122],[206,216],[216,92],[92,206],[164,2],[2,167],[167,164],[242,141],[141,241],[241,242],[0,164],[164,37],[37,0],[11,72],[72,12],[12,11],[12,38],[38,13],[13,12],[70,63],[63,71],[71,70],[31,226],[226,111],[111,31],[36,101],[101,205],[205,36],[203,206],[206,165],[165,203],[126,209],[209,217],[217,126],[98,165],[165,97],[97,98],[237,220],[220,218],[218,237],[237,239],[239,241],[241,237],[210,214],[214,169],[169,210],[140,171],[171,32],[32,140],[241,125],[125,237],[237,241],[179,86],[86,178],[178,179],[180,85],[85,179],[179,180],[181,84],[84,180],[180,181],[182,83],[83,181],[181,182],[194,201],[201,182],[182,194],[177,137],[137,132],[132,177],[184,76],[76,183],[183,184],[185,61],[61,184],[184,185],[186,57],[57,185],[185,186],[216,212],[212,186],[186,216],[192,214],[214,187],[187,192],[139,34],[34,156],[156,139],[218,79],[79,237],[237,218],[147,123],[123,177],[177,147],[45,44],[44,4],[4,45],[208,201],[201,32],[32,208],[98,64],[64,129],[129,98],[192,213],[213,138],[138,192],[235,59],[59,219],[219,235],[141,242],[242,97],[97,141],[97,2],[2,141],[141,97],[240,75],[75,235],[235,240],[229,24],[24,228],[228,229],[31,25],[25,226],[226,31],[230,23],[23,229],[229,230],[231,22],[22,230],[230,231],[232,26],[26,231],[231,232],[233,112],[112,232],[232,233],[244,189],[189,243],[243,244],[189,221],[221,190],[190,189],[222,28],[28,221],[221,222],[223,27],[27,222],[222,223],[224,29],[29,223],[223,224],[225,30],[30,224],[224,225],[113,247],[247,225],[225,113],[99,60],[60,240],[240,99],[213,147],[147,215],[215,213],[60,20],[20,166],[166,60],[192,187],[187,213],[213,192],[243,112],[112,244],[244,243],[244,233],[233,245],[245,244],[245,128],[128,188],[188,245],[188,114],[114,174],[174,188],[134,131],[131,220],[220,134],[174,217],[217,236],[236,174],[236,198],[198,134],[134,236],[215,177],[177,58],[58,215],[156,143],[143,124],[124,156],[25,110],[110,7],[7,25],[31,228],[228,25],[25,31],[264,356],[356,368],[368,264],[0,11],[11,267],[267,0],[451,452],[452,349],[349,451],[267,302],[302,269],[269,267],[350,357],[357,277],[277,350],[350,452],[452,357],[357,350],[299,333],[333,297],[297,299],[396,175],[175,377],[377,396],[280,347],[347,330],[330,280],[269,303],[303,270],[270,269],[151,9],[9,337],[337,151],[344,278],[278,360],[360,344],[424,418],[418,431],[431,424],[270,304],[304,409],[409,270],[272,310],[310,407],[407,272],[322,270],[270,410],[410,322],[449,450],[450,347],[347,449],[432,422],[422,434],[434,432],[18,313],[313,17],[17,18],[291,306],[306,375],[375,291],[259,387],[387,260],[260,259],[424,335],[335,418],[418,424],[434,364],[364,416],[416,434],[391,423],[423,327],[327,391],[301,251],[251,298],[298,301],[275,281],[281,4],[4,275],[254,373],[373,253],[253,254],[375,307],[307,321],[321,375],[280,425],[425,411],[411,280],[200,421],[421,18],[18,200],[335,321],[321,406],[406,335],[321,320],[320,405],[405,321],[314,315],[315,17],[17,314],[423,426],[426,266],[266,423],[396,377],[377,369],[369,396],[270,322],[322,269],[269,270],[413,417],[417,464],[464,413],[385,386],[386,258],[258,385],[248,456],[456,419],[419,248],[298,284],[284,333],[333,298],[168,417],[417,8],[8,168],[448,346],[346,261],[261,448],[417,413],[413,285],[285,417],[326,327],[327,328],[328,326],[277,355],[355,329],[329,277],[309,392],[392,438],[438,309],[381,382],[382,256],[256,381],[279,429],[429,360],[360,279],[365,364],[364,379],[379,365],[355,277],[277,437],[437,355],[282,443],[443,283],[283,282],[281,275],[275,363],[363,281],[395,431],[431,369],[369,395],[299,297],[297,337],[337,299],[335,273],[273,321],[321,335],[348,450],[450,349],[349,348],[359,446],[446,467],[467,359],[283,293],[293,282],[282,283],[250,458],[458,462],[462,250],[300,276],[276,383],[383,300],[292,308],[308,325],[325,292],[283,276],[276,293],[293,283],[264,372],[372,447],[447,264],[346,352],[352,340],[340,346],[354,274],[274,19],[19,354],[363,456],[456,281],[281,363],[426,436],[436,425],[425,426],[380,381],[381,252],[252,380],[267,269],[269,393],[393,267],[421,200],[200,428],[428,421],[371,266],[266,329],[329,371],[432,287],[287,422],[422,432],[290,250],[250,328],[328,290],[385,258],[258,384],[384,385],[446,265],[265,342],[342,446],[386,387],[387,257],[257,386],[422,424],[424,430],[430,422],[445,342],[342,276],[276,445],[422,273],[273,424],[424,422],[306,292],[292,307],[307,306],[352,366],[366,345],[345,352],[268,271],[271,302],[302,268],[358,423],[423,371],[371,358],[327,294],[294,460],[460,327],[331,279],[279,294],[294,331],[303,271],[271,304],[304,303],[436,432],[432,427],[427,436],[304,272],[272,408],[408,304],[395,394],[394,431],[431,395],[378,395],[395,400],[400,378],[296,334],[334,299],[299,296],[6,351],[351,168],[168,6],[376,352],[352,411],[411,376],[307,325],[325,320],[320,307],[285,295],[295,336],[336,285],[320,319],[319,404],[404,320],[329,330],[330,349],[349,329],[334,293],[293,333],[333,334],[366,323],[323,447],[447,366],[316,15],[15,315],[315,316],[331,358],[358,279],[279,331],[317,14],[14,316],[316,317],[8,285],[285,9],[9,8],[277,329],[329,350],[350,277],[253,374],[374,252],[252,253],[319,318],[318,403],[403,319],[351,6],[6,419],[419,351],[324,318],[318,325],[325,324],[397,367],[367,365],[365,397],[288,435],[435,397],[397,288],[278,344],[344,439],[439,278],[310,272],[272,311],[311,310],[248,195],[195,281],[281,248],[375,273],[273,291],[291,375],[175,396],[396,199],[199,175],[312,311],[311,268],[268,312],[276,283],[283,445],[445,276],[390,373],[373,339],[339,390],[295,282],[282,296],[296,295],[448,449],[449,346],[346,448],[356,264],[264,454],[454,356],[337,336],[336,299],[299,337],[337,338],[338,151],[151,337],[294,278],[278,455],[455,294],[308,292],[292,415],[415,308],[429,358],[358,355],[355,429],[265,340],[340,372],[372,265],[352,346],[346,280],[280,352],[295,442],[442,282],[282,295],[354,19],[19,370],[370,354],[285,441],[441,295],[295,285],[195,248],[248,197],[197,195],[457,440],[440,274],[274,457],[301,300],[300,368],[368,301],[417,351],[351,465],[465,417],[251,301],[301,389],[389,251],[394,395],[395,379],[379,394],[399,412],[412,419],[419,399],[410,436],[436,322],[322,410],[326,2],[2,393],[393,326],[354,370],[370,461],[461,354],[393,164],[164,267],[267,393],[268,302],[302,12],[12,268],[312,268],[268,13],[13,312],[298,293],[293,301],[301,298],[265,446],[446,340],[340,265],[280,330],[330,425],[425,280],[322,426],[426,391],[391,322],[420,429],[429,437],[437,420],[393,391],[391,326],[326,393],[344,440],[440,438],[438,344],[458,459],[459,461],[461,458],[364,434],[434,394],[394,364],[428,396],[396,262],[262,428],[274,354],[354,457],[457,274],[317,316],[316,402],[402,317],[316,315],[315,403],[403,316],[315,314],[314,404],[404,315],[314,313],[313,405],[405,314],[313,421],[421,406],[406,313],[323,366],[366,361],[361,323],[292,306],[306,407],[407,292],[306,291],[291,408],[408,306],[291,287],[287,409],[409,291],[287,432],[432,410],[410,287],[427,434],[434,411],[411,427],[372,264],[264,383],[383,372],[459,309],[309,457],[457,459],[366,352],[352,401],[401,366],[1,274],[274,4],[4,1],[418,421],[421,262],[262,418],[331,294],[294,358],[358,331],[435,433],[433,367],[367,435],[392,289],[289,439],[439,392],[328,462],[462,326],[326,328],[94,2],[2,370],[370,94],[289,305],[305,455],[455,289],[339,254],[254,448],[448,339],[359,255],[255,446],[446,359],[254,253],[253,449],[449,254],[253,252],[252,450],[450,253],[252,256],[256,451],[451,252],[256,341],[341,452],[452,256],[414,413],[413,463],[463,414],[286,441],[441,414],[414,286],[286,258],[258,441],[441,286],[258,257],[257,442],[442,258],[257,259],[259,443],[443,257],[259,260],[260,444],[444,259],[260,467],[467,445],[445,260],[309,459],[459,250],[250,309],[305,289],[289,290],[290,305],[305,290],[290,460],[460,305],[401,376],[376,435],[435,401],[309,250],[250,392],[392,309],[376,411],[411,433],[433,376],[453,341],[341,464],[464,453],[357,453],[453,465],[465,357],[343,357],[357,412],[412,343],[437,343],[343,399],[399,437],[344,360],[360,440],[440,344],[420,437],[437,456],[456,420],[360,420],[420,363],[363,360],[361,401],[401,288],[288,361],[265,372],[372,353],[353,265],[390,339],[339,249],[249,390],[339,448],[448,255],[255,339]);function _l(t){t.j={faceLandmarks:[],faceBlendshapes:[],facialTransformationMatrixes:[]}}var re=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!1),this.j={faceLandmarks:[],faceBlendshapes:[],facialTransformationMatrixes:[]},this.outputFacialTransformationMatrixes=this.outputFaceBlendshapes=!1,C(t=this.h=new Fc,0,1,e=new ne),this.v=new Oc,C(this.h,0,3,this.v),this.s=new Jn,C(this.h,0,2,this.s),St(this.s,4,1),$(this.s,2,.5),$(this.v,2,.5),$(this.h,4,.5)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return"numFaces"in t&&St(this.s,4,t.numFaces??1),"minFaceDetectionConfidence"in t&&$(this.s,2,t.minFaceDetectionConfidence??.5),"minTrackingConfidence"in t&&$(this.h,4,t.minTrackingConfidence??.5),"minFacePresenceConfidence"in t&&$(this.v,2,t.minFacePresenceConfidence??.5),"outputFaceBlendshapes"in t&&(this.outputFaceBlendshapes=!!t.outputFaceBlendshapes),"outputFacialTransformationMatrixes"in t&&(this.outputFacialTransformationMatrixes=!!t.outputFacialTransformationMatrixes),this.l(t)}D(t,e){return _l(this),ot(this,t,e),this.j}F(t,e,s){return _l(this),kt(this,t,s,e),this.j}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"face_landmarks");const e=new We;ut(e,jh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.face_landmarker.FaceLandmarkerGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"NORM_LANDMARKS:face_landmarks"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("face_landmarks",(a,n)=>{for(const i of a)a=Pa(i),this.j.faceLandmarks.push(Qn(a));v(this,n)}),this.g.attachEmptyPacketListener("face_landmarks",a=>{v(this,a)}),this.outputFaceBlendshapes&&(U(t,"blendshapes"),O(s,"BLENDSHAPES:blendshapes"),this.g.attachProtoVectorListener("blendshapes",(a,n)=>{if(this.outputFaceBlendshapes)for(const i of a)a=zn(i),this.j.faceBlendshapes.push(to(a.g()??[]));v(this,n)}),this.g.attachEmptyPacketListener("blendshapes",a=>{v(this,a)})),this.outputFacialTransformationMatrixes&&(U(t,"face_geometry"),O(s,"FACE_GEOMETRY:face_geometry"),this.g.attachProtoVectorListener("face_geometry",(a,n)=>{if(this.outputFacialTransformationMatrixes)for(const i of a)(a=B(Ph(i),$h,2))&&this.j.facialTransformationMatrixes.push({rows:st(a,1)??0??0,columns:st(a,2)??0??0,data:us(a,3,Zt,cs()).slice()??[]});v(this,n)}),this.g.attachEmptyPacketListener("face_geometry",a=>{v(this,a)})),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};re.prototype.detectForVideo=re.prototype.F,re.prototype.detect=re.prototype.D,re.prototype.setOptions=re.prototype.o,re.createFromModelPath=function(t,e){return D(re,t,{baseOptions:{modelAssetPath:e}})},re.createFromModelBuffer=function(t,e){return D(re,t,{baseOptions:{modelAssetBuffer:e}})},re.createFromOptions=function(t,e){return D(re,t,e)},re.FACE_LANDMARKS_LIPS=oo,re.FACE_LANDMARKS_LEFT_EYE=lo,re.FACE_LANDMARKS_LEFT_EYEBROW=co,re.FACE_LANDMARKS_LEFT_IRIS=pu,re.FACE_LANDMARKS_RIGHT_EYE=uo,re.FACE_LANDMARKS_RIGHT_EYEBROW=po,re.FACE_LANDMARKS_RIGHT_IRIS=hu,re.FACE_LANDMARKS_FACE_OVAL=ho,re.FACE_LANDMARKS_CONTOURS=fu,re.FACE_LANDMARKS_TESSELATION=bu;var gt=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!0),C(t=this.j=new Bc,0,1,e=new ne)}get baseOptions(){return B(this.j,ne,1)}set baseOptions(t){C(this.j,0,1,t)}o(t){return super.l(t)}Oa(t,e,s){const a=typeof e!="function"?e:{};if(this.h=typeof e=="function"?e:s,ot(this,t,a??{}),!this.h)return this.s}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"stylized_image");const e=new We;ut(e,qh,this.j);const s=new Ee;Je(s,"mediapipe.tasks.vision.face_stylizer.FaceStylizerGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"STYLIZED_IMAGE:stylized_image"),s.o(e),Qe(t,s),this.g.U("stylized_image",(a,n)=>{var i=!this.h,r=a.data,o=a.width;const l=o*(a=a.height);if(r instanceof Uint8Array)if(r.length===3*l){const d=new Uint8ClampedArray(4*l);for(let c=0;c<l;++c)d[4*c]=r[3*c],d[4*c+1]=r[3*c+1],d[4*c+2]=r[3*c+2],d[4*c+3]=255;r=new ImageData(d,o,a)}else{if(r.length!==4*l)throw Error("Unsupported channel count: "+r.length/l);r=new ImageData(new Uint8ClampedArray(r.buffer,r.byteOffset,r.length),o,a)}else if(!(r instanceof WebGLTexture))throw Error(`Unsupported format: ${r.constructor.name}`);o=new xe([r],!1,!1,this.g.i.canvas,this.O,o,a),this.s=i=i?o.clone():o,this.h&&this.h(i),v(this,n)}),this.g.attachEmptyPacketListener("stylized_image",a=>{this.s=null,this.h&&this.h(null),v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};gt.prototype.stylize=gt.prototype.Oa,gt.prototype.setOptions=gt.prototype.o,gt.createFromModelPath=function(t,e){return D(gt,t,{baseOptions:{modelAssetPath:e}})},gt.createFromModelBuffer=function(t,e){return D(gt,t,{baseOptions:{modelAssetBuffer:e}})},gt.createFromOptions=function(t,e){return D(gt,t,e)};var fo=ft([0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]);function Il(t){t.gestures=[],t.landmarks=[],t.worldLandmarks=[],t.handedness=[]}function Ml(t){return t.gestures.length===0?{gestures:[],landmarks:[],worldLandmarks:[],handedness:[],handednesses:[]}:{gestures:t.gestures,landmarks:t.landmarks,worldLandmarks:t.worldLandmarks,handedness:t.handedness,handednesses:t.handedness}}function Pl(t,e=!0){const s=[];for(const n of t){var a=zn(n);t=[];for(const i of a.g())a=e&&st(i,1)!=null?st(i,1)??0:-1,t.push({score:de(i,2)??0,index:a,categoryName:nt(i,3)??""??"",displayName:nt(i,4)??""??""});s.push(t)}return s}var Ne=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!1),this.gestures=[],this.landmarks=[],this.worldLandmarks=[],this.handedness=[],C(t=this.j=new Vc,0,1,e=new ne),this.s=new Kr,C(this.j,0,2,this.s),this.C=new Yr,C(this.s,0,3,this.C),this.v=new Uc,C(this.s,0,2,this.v),this.h=new Dh,C(this.j,0,3,this.h),$(this.v,2,.5),$(this.s,4,.5),$(this.C,2,.5)}get baseOptions(){return B(this.j,ne,1)}set baseOptions(t){C(this.j,0,1,t)}o(t){var n,i,r,o;if(St(this.v,3,t.numHands??1),"minHandDetectionConfidence"in t&&$(this.v,2,t.minHandDetectionConfidence??.5),"minTrackingConfidence"in t&&$(this.s,4,t.minTrackingConfidence??.5),"minHandPresenceConfidence"in t&&$(this.C,2,t.minHandPresenceConfidence??.5),t.cannedGesturesClassifierOptions){var e=new $s,s=e,a=Ji(t.cannedGesturesClassifierOptions,(n=B(this.h,$s,3))==null?void 0:n.h());C(s,0,2,a),C(this.h,0,3,e)}else t.cannedGesturesClassifierOptions===void 0&&((i=B(this.h,$s,3))==null||i.g());return t.customGesturesClassifierOptions?(C(s=e=new $s,0,2,a=Ji(t.customGesturesClassifierOptions,(r=B(this.h,$s,4))==null?void 0:r.h())),C(this.h,0,4,e)):t.customGesturesClassifierOptions===void 0&&((o=B(this.h,$s,4))==null||o.g()),this.l(t)}Ja(t,e){return Il(this),ot(this,t,e),Ml(this)}Ka(t,e,s){return Il(this),kt(this,t,s,e),Ml(this)}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"hand_gestures"),U(t,"hand_landmarks"),U(t,"world_hand_landmarks"),U(t,"handedness");const e=new We;ut(e,Rh,this.j);const s=new Ee;Je(s,"mediapipe.tasks.vision.gesture_recognizer.GestureRecognizerGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"HAND_GESTURES:hand_gestures"),O(s,"LANDMARKS:hand_landmarks"),O(s,"WORLD_LANDMARKS:world_hand_landmarks"),O(s,"HANDEDNESS:handedness"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("hand_landmarks",(a,n)=>{for(const i of a){a=Pa(i);const r=[];for(const o of qt(a,Pc,1))r.push({x:de(o,1)??0,y:de(o,2)??0,z:de(o,3)??0,visibility:de(o,4)??0});this.landmarks.push(r)}v(this,n)}),this.g.attachEmptyPacketListener("hand_landmarks",a=>{v(this,a)}),this.g.attachProtoVectorListener("world_hand_landmarks",(a,n)=>{for(const i of a){a=Ds(i);const r=[];for(const o of qt(a,Mc,1))r.push({x:de(o,1)??0,y:de(o,2)??0,z:de(o,3)??0,visibility:de(o,4)??0});this.worldLandmarks.push(r)}v(this,n)}),this.g.attachEmptyPacketListener("world_hand_landmarks",a=>{v(this,a)}),this.g.attachProtoVectorListener("hand_gestures",(a,n)=>{this.gestures.push(...Pl(a,!1)),v(this,n)}),this.g.attachEmptyPacketListener("hand_gestures",a=>{v(this,a)}),this.g.attachProtoVectorListener("handedness",(a,n)=>{this.handedness.push(...Pl(a)),v(this,n)}),this.g.attachEmptyPacketListener("handedness",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};function jl(t){return{landmarks:t.landmarks,worldLandmarks:t.worldLandmarks,handednesses:t.handedness,handedness:t.handedness}}Ne.prototype.recognizeForVideo=Ne.prototype.Ka,Ne.prototype.recognize=Ne.prototype.Ja,Ne.prototype.setOptions=Ne.prototype.o,Ne.createFromModelPath=function(t,e){return D(Ne,t,{baseOptions:{modelAssetPath:e}})},Ne.createFromModelBuffer=function(t,e){return D(Ne,t,{baseOptions:{modelAssetBuffer:e}})},Ne.createFromOptions=function(t,e){return D(Ne,t,e)},Ne.HAND_CONNECTIONS=fo;var Be=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!1),this.landmarks=[],this.worldLandmarks=[],this.handedness=[],C(t=this.h=new Kr,0,1,e=new ne),this.s=new Yr,C(this.h,0,3,this.s),this.j=new Uc,C(this.h,0,2,this.j),St(this.j,3,1),$(this.j,2,.5),$(this.s,2,.5),$(this.h,4,.5)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return"numHands"in t&&St(this.j,3,t.numHands??1),"minHandDetectionConfidence"in t&&$(this.j,2,t.minHandDetectionConfidence??.5),"minTrackingConfidence"in t&&$(this.h,4,t.minTrackingConfidence??.5),"minHandPresenceConfidence"in t&&$(this.s,2,t.minHandPresenceConfidence??.5),this.l(t)}D(t,e){return this.landmarks=[],this.worldLandmarks=[],this.handedness=[],ot(this,t,e),jl(this)}F(t,e,s){return this.landmarks=[],this.worldLandmarks=[],this.handedness=[],kt(this,t,s,e),jl(this)}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"hand_landmarks"),U(t,"world_hand_landmarks"),U(t,"handedness");const e=new We;ut(e,Oh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.hand_landmarker.HandLandmarkerGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"LANDMARKS:hand_landmarks"),O(s,"WORLD_LANDMARKS:world_hand_landmarks"),O(s,"HANDEDNESS:handedness"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("hand_landmarks",(a,n)=>{for(const i of a)a=Pa(i),this.landmarks.push(Qn(a));v(this,n)}),this.g.attachEmptyPacketListener("hand_landmarks",a=>{v(this,a)}),this.g.attachProtoVectorListener("world_hand_landmarks",(a,n)=>{for(const i of a)a=Ds(i),this.worldLandmarks.push(xa(a));v(this,n)}),this.g.attachEmptyPacketListener("world_hand_landmarks",a=>{v(this,a)}),this.g.attachProtoVectorListener("handedness",(a,n)=>{var i=this.handedness,r=i.push;const o=[];for(const l of a){a=zn(l);const d=[];for(const c of a.g())d.push({score:de(c,2)??0,index:st(c,1)??0??-1,categoryName:nt(c,3)??""??"",displayName:nt(c,4)??""??""});o.push(d)}r.call(i,...o),v(this,n)}),this.g.attachEmptyPacketListener("handedness",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Be.prototype.detectForVideo=Be.prototype.F,Be.prototype.detect=Be.prototype.D,Be.prototype.setOptions=Be.prototype.o,Be.createFromModelPath=function(t,e){return D(Be,t,{baseOptions:{modelAssetPath:e}})},Be.createFromModelBuffer=function(t,e){return D(Be,t,{baseOptions:{modelAssetBuffer:e}})},Be.createFromOptions=function(t,e){return D(Be,t,e)},Be.HAND_CONNECTIONS=fo;var mu=ft([0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],[12,14],[14,16],[16,18],[16,20],[16,22],[18,20],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[27,31],[28,32]);function ql(t){t.h={faceLandmarks:[],faceBlendshapes:[],poseLandmarks:[],poseWorldLandmarks:[],poseSegmentationMasks:[],leftHandLandmarks:[],leftHandWorldLandmarks:[],rightHandLandmarks:[],rightHandWorldLandmarks:[]}}function Dl(t){try{if(!t.C)return t.h;t.C(t.h)}finally{Kn(t)}}function Va(t,e){t=Pa(t),e.push(Qn(t))}var se=class extends je{constructor(t,e){super(new rt(t,e),"input_frames_image",null,!1),this.h={faceLandmarks:[],faceBlendshapes:[],poseLandmarks:[],poseWorldLandmarks:[],poseSegmentationMasks:[],leftHandLandmarks:[],leftHandWorldLandmarks:[],rightHandLandmarks:[],rightHandWorldLandmarks:[]},this.outputPoseSegmentationMasks=this.outputFaceBlendshapes=!1,C(t=this.j=new Qc,0,1,e=new ne),this.J=new Yr,C(this.j,0,2,this.J),this.Z=new Fh,C(this.j,0,3,this.Z),this.s=new Jn,C(this.j,0,4,this.s),this.H=new Oc,C(this.j,0,5,this.H),this.v=new zc,C(this.j,0,6,this.v),this.K=new Jc,C(this.j,0,7,this.K),$(this.s,2,.5),$(this.s,3,.3),$(this.H,2,.5),$(this.v,2,.5),$(this.v,3,.3),$(this.K,2,.5),$(this.J,2,.5)}get baseOptions(){return B(this.j,ne,1)}set baseOptions(t){C(this.j,0,1,t)}o(t){return"minFaceDetectionConfidence"in t&&$(this.s,2,t.minFaceDetectionConfidence??.5),"minFaceSuppressionThreshold"in t&&$(this.s,3,t.minFaceSuppressionThreshold??.3),"minFacePresenceConfidence"in t&&$(this.H,2,t.minFacePresenceConfidence??.5),"outputFaceBlendshapes"in t&&(this.outputFaceBlendshapes=!!t.outputFaceBlendshapes),"minPoseDetectionConfidence"in t&&$(this.v,2,t.minPoseDetectionConfidence??.5),"minPoseSuppressionThreshold"in t&&$(this.v,3,t.minPoseSuppressionThreshold??.3),"minPosePresenceConfidence"in t&&$(this.K,2,t.minPosePresenceConfidence??.5),"outputPoseSegmentationMasks"in t&&(this.outputPoseSegmentationMasks=!!t.outputPoseSegmentationMasks),"minHandLandmarksConfidence"in t&&$(this.J,2,t.minHandLandmarksConfidence??.5),this.l(t)}D(t,e,s){const a=typeof e!="function"?e:{};return this.C=typeof e=="function"?e:s,ql(this),ot(this,t,a),Dl(this)}F(t,e,s,a){const n=typeof s!="function"?s:{};return this.C=typeof s=="function"?s:a,ql(this),kt(this,t,n,e),Dl(this)}m(){var t=new qe;ee(t,"input_frames_image"),U(t,"pose_landmarks"),U(t,"pose_world_landmarks"),U(t,"face_landmarks"),U(t,"left_hand_landmarks"),U(t,"left_hand_world_landmarks"),U(t,"right_hand_landmarks"),U(t,"right_hand_world_landmarks");const e=new We,s=new il;Hi(s,1,Xs("type.googleapis.com/mediapipe.tasks.vision.holistic_landmarker.proto.HolisticLandmarkerGraphOptions"),""),function(n,i){if(i!=null)if(Array.isArray(i))Q(n,2,Ud(i));else{if(!(typeof i=="string"||i instanceof It||La(i)))throw Error("invalid value in Any.value field: "+i+" expected a ByteString, a base64 encoded string, a Uint8Array or a jspb array");Hi(n,2,fr(i,!1),gs())}}(s,this.j.g());const a=new Ee;Je(a,"mediapipe.tasks.vision.holistic_landmarker.HolisticLandmarkerGraph"),xn(a,8,il,s),Y(a,"IMAGE:input_frames_image"),O(a,"POSE_LANDMARKS:pose_landmarks"),O(a,"POSE_WORLD_LANDMARKS:pose_world_landmarks"),O(a,"FACE_LANDMARKS:face_landmarks"),O(a,"LEFT_HAND_LANDMARKS:left_hand_landmarks"),O(a,"LEFT_HAND_WORLD_LANDMARKS:left_hand_world_landmarks"),O(a,"RIGHT_HAND_LANDMARKS:right_hand_landmarks"),O(a,"RIGHT_HAND_WORLD_LANDMARKS:right_hand_world_landmarks"),a.o(e),Qe(t,a),Yn(this,t),this.g.attachProtoListener("pose_landmarks",(n,i)=>{Va(n,this.h.poseLandmarks),v(this,i)}),this.g.attachEmptyPacketListener("pose_landmarks",n=>{v(this,n)}),this.g.attachProtoListener("pose_world_landmarks",(n,i)=>{var r=this.h.poseWorldLandmarks;n=Ds(n),r.push(xa(n)),v(this,i)}),this.g.attachEmptyPacketListener("pose_world_landmarks",n=>{v(this,n)}),this.outputPoseSegmentationMasks&&(O(a,"POSE_SEGMENTATION_MASK:pose_segmentation_mask"),Gs(this,"pose_segmentation_mask"),this.g.U("pose_segmentation_mask",(n,i)=>{this.h.poseSegmentationMasks=[Js(this,n,!0,!this.C)],v(this,i)}),this.g.attachEmptyPacketListener("pose_segmentation_mask",n=>{this.h.poseSegmentationMasks=[],v(this,n)})),this.g.attachProtoListener("face_landmarks",(n,i)=>{Va(n,this.h.faceLandmarks),v(this,i)}),this.g.attachEmptyPacketListener("face_landmarks",n=>{v(this,n)}),this.outputFaceBlendshapes&&(U(t,"extra_blendshapes"),O(a,"FACE_BLENDSHAPES:extra_blendshapes"),this.g.attachProtoListener("extra_blendshapes",(n,i)=>{var r=this.h.faceBlendshapes;this.outputFaceBlendshapes&&(n=zn(n),r.push(to(n.g()??[]))),v(this,i)}),this.g.attachEmptyPacketListener("extra_blendshapes",n=>{v(this,n)})),this.g.attachProtoListener("left_hand_landmarks",(n,i)=>{Va(n,this.h.leftHandLandmarks),v(this,i)}),this.g.attachEmptyPacketListener("left_hand_landmarks",n=>{v(this,n)}),this.g.attachProtoListener("left_hand_world_landmarks",(n,i)=>{var r=this.h.leftHandWorldLandmarks;n=Ds(n),r.push(xa(n)),v(this,i)}),this.g.attachEmptyPacketListener("left_hand_world_landmarks",n=>{v(this,n)}),this.g.attachProtoListener("right_hand_landmarks",(n,i)=>{Va(n,this.h.rightHandLandmarks),v(this,i)}),this.g.attachEmptyPacketListener("right_hand_landmarks",n=>{v(this,n)}),this.g.attachProtoListener("right_hand_world_landmarks",(n,i)=>{var r=this.h.rightHandWorldLandmarks;n=Ds(n),r.push(xa(n)),v(this,i)}),this.g.attachEmptyPacketListener("right_hand_world_landmarks",n=>{v(this,n)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};se.prototype.detectForVideo=se.prototype.F,se.prototype.detect=se.prototype.D,se.prototype.setOptions=se.prototype.o,se.createFromModelPath=function(t,e){return D(se,t,{baseOptions:{modelAssetPath:e}})},se.createFromModelBuffer=function(t,e){return D(se,t,{baseOptions:{modelAssetBuffer:e}})},se.createFromOptions=function(t,e){return D(se,t,e)},se.HAND_CONNECTIONS=fo,se.POSE_CONNECTIONS=mu,se.FACE_LANDMARKS_LIPS=oo,se.FACE_LANDMARKS_LEFT_EYE=lo,se.FACE_LANDMARKS_LEFT_EYEBROW=co,se.FACE_LANDMARKS_LEFT_IRIS=pu,se.FACE_LANDMARKS_RIGHT_EYE=uo,se.FACE_LANDMARKS_RIGHT_EYEBROW=po,se.FACE_LANDMARKS_RIGHT_IRIS=hu,se.FACE_LANDMARKS_FACE_OVAL=ho,se.FACE_LANDMARKS_CONTOURS=fu,se.FACE_LANDMARKS_TESSELATION=bu;var Xe=class extends je{constructor(t,e){super(new rt(t,e),"input_image","norm_rect",!0),this.j={classifications:[]},C(t=this.h=new Yc,0,1,e=new ne)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return C(this.h,0,2,Ji(t,B(this.h,zr,2))),this.l(t)}sa(t,e){return this.j={classifications:[]},ot(this,t,e),this.j}ta(t,e,s){return this.j={classifications:[]},kt(this,t,s,e),this.j}m(){var t=new qe;ee(t,"input_image"),ee(t,"norm_rect"),U(t,"classifications");const e=new We;ut(e,Nh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.image_classifier.ImageClassifierGraph"),Y(s,"IMAGE:input_image"),Y(s,"NORM_RECT:norm_rect"),O(s,"CLASSIFICATIONS:classifications"),s.o(e),Qe(t,s),this.g.attachProtoListener("classifications",(a,n)=>{this.j=function(i){const r={classifications:qt(i,Ah,1).map(o=>{var l;return to(((l=B(o,Lc,4))==null?void 0:l.g())??[],st(o,2)??0,nt(o,3)??"")})};return gn(Us(i,2))!=null&&(r.timestampMs=gn(Us(i,2))??0),r}(Th(a)),v(this,n)}),this.g.attachEmptyPacketListener("classifications",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Xe.prototype.classifyForVideo=Xe.prototype.ta,Xe.prototype.classify=Xe.prototype.sa,Xe.prototype.setOptions=Xe.prototype.o,Xe.createFromModelPath=function(t,e){return D(Xe,t,{baseOptions:{modelAssetPath:e}})},Xe.createFromModelBuffer=function(t,e){return D(Xe,t,{baseOptions:{modelAssetBuffer:e}})},Xe.createFromOptions=function(t,e){return D(Xe,t,e)};var He=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!0),this.h=new Kc,this.embeddings={embeddings:[]},C(t=this.h,0,1,e=new ne)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){var e=this.h,s=B(this.h,fl,2);return s=s?s.clone():new fl,t.l2Normalize!==void 0?Aa(s,1,t.l2Normalize):"l2Normalize"in t&&Q(s,1),t.quantize!==void 0?Aa(s,2,t.quantize):"quantize"in t&&Q(s,2),C(e,0,2,s),this.l(t)}za(t,e){return ot(this,t,e),this.embeddings}Aa(t,e,s){return kt(this,t,s,e),this.embeddings}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"embeddings_out");const e=new We;ut(e,Bh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.image_embedder.ImageEmbedderGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"EMBEDDINGS:embeddings_out"),s.o(e),Qe(t,s),this.g.attachProtoListener("embeddings_out",(a,n)=>{a=_h(a),this.embeddings=function(i){return{embeddings:qt(i,Lh,1).map(r=>{var l,d;const o={headIndex:st(r,3)??0??-1,headName:nt(r,4)??""??""};if(Jd(r,hl,fi(r,1))!==void 0)r=us(r=B(r,hl,fi(r,1)),1,Zt,cs()),o.floatEmbedding=r.slice();else{const c=new Uint8Array(0);o.quantizedEmbedding=((d=(l=B(r,Ch,fi(r,2)))==null?void 0:l.oa())==null?void 0:d.h())??c}return o}),timestampMs:gn(Us(i,2))??0}}(a),v(this,n)}),this.g.attachEmptyPacketListener("embeddings_out",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};He.cosineSimilarity=function(t,e){if(t.floatEmbedding&&e.floatEmbedding)t=vl(t.floatEmbedding,e.floatEmbedding);else{if(!t.quantizedEmbedding||!e.quantizedEmbedding)throw Error("Cannot compute cosine similarity between quantized and float embeddings.");t=vl(xl(t.quantizedEmbedding),xl(e.quantizedEmbedding))}return t},He.prototype.embedForVideo=He.prototype.Aa,He.prototype.embed=He.prototype.za,He.prototype.setOptions=He.prototype.o,He.createFromModelPath=function(t,e){return D(He,t,{baseOptions:{modelAssetPath:e}})},He.createFromModelBuffer=function(t,e){return D(He,t,{baseOptions:{modelAssetBuffer:e}})},He.createFromOptions=function(t,e){return D(He,t,e)};var Ki=class{constructor(t,e,s){this.confidenceMasks=t,this.categoryMask=e,this.qualityScores=s}close(){var t,e;(t=this.confidenceMasks)==null||t.forEach(s=>{s.close()}),(e=this.categoryMask)==null||e.close()}};function Rl(t){t.categoryMask=void 0,t.confidenceMasks=void 0,t.qualityScores=void 0}function Ol(t){try{const e=new Ki(t.confidenceMasks,t.categoryMask,t.qualityScores);if(!t.j)return e;t.j(e)}finally{Kn(t)}}Ki.prototype.close=Ki.prototype.close;var Le=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!1),this.s=[],this.outputCategoryMask=!1,this.outputConfidenceMasks=!0,this.h=new eo,this.v=new Xc,C(this.h,0,3,this.v),C(t=this.h,0,1,e=new ne)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return t.displayNamesLocale!==void 0?Q(this.h,2,Xs(t.displayNamesLocale)):"displayNamesLocale"in t&&Q(this.h,2),"outputCategoryMask"in t&&(this.outputCategoryMask=t.outputCategoryMask??!1),"outputConfidenceMasks"in t&&(this.outputConfidenceMasks=t.outputConfidenceMasks??!0),super.l(t)}I(){(function(t){var s,a;const e=qt(t.da(),Ee,1).filter(n=>(nt(n,1)??"").includes("mediapipe.tasks.TensorsToSegmentationCalculator"));if(t.s=[],e.length>1)throw Error("The graph has more than one mediapipe.tasks.TensorsToSegmentationCalculator.");e.length===1&&(((a=(s=B(e[0],We,7))==null?void 0:s.l())==null?void 0:a.g())??new Map).forEach((n,i)=>{t.s[Number(i)]=nt(n,1)??""})})(this)}segment(t,e,s){const a=typeof e!="function"?e:{};return this.j=typeof e=="function"?e:s,Rl(this),ot(this,t,a),Ol(this)}Ma(t,e,s,a){const n=typeof s!="function"?s:{};return this.j=typeof s=="function"?s:a,Rl(this),kt(this,t,n,e),Ol(this)}Da(){return this.s}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect");const e=new We;ut(e,eu,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.image_segmenter.ImageSegmenterGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),s.o(e),Qe(t,s),Yn(this,t),this.outputConfidenceMasks&&(U(t,"confidence_masks"),O(s,"CONFIDENCE_MASKS:confidence_masks"),Gs(this,"confidence_masks"),this.g.ca("confidence_masks",(a,n)=>{this.confidenceMasks=a.map(i=>Js(this,i,!0,!this.j)),v(this,n)}),this.g.attachEmptyPacketListener("confidence_masks",a=>{this.confidenceMasks=[],v(this,a)})),this.outputCategoryMask&&(U(t,"category_mask"),O(s,"CATEGORY_MASK:category_mask"),Gs(this,"category_mask"),this.g.U("category_mask",(a,n)=>{this.categoryMask=Js(this,a,!1,!this.j),v(this,n)}),this.g.attachEmptyPacketListener("category_mask",a=>{this.categoryMask=void 0,v(this,a)})),U(t,"quality_scores"),O(s,"QUALITY_SCORES:quality_scores"),this.g.attachFloatVectorListener("quality_scores",(a,n)=>{this.qualityScores=a,v(this,n)}),this.g.attachEmptyPacketListener("quality_scores",a=>{this.categoryMask=void 0,v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Le.prototype.getLabels=Le.prototype.Da,Le.prototype.segmentForVideo=Le.prototype.Ma,Le.prototype.segment=Le.prototype.segment,Le.prototype.setOptions=Le.prototype.o,Le.createFromModelPath=function(t,e){return D(Le,t,{baseOptions:{modelAssetPath:e}})},Le.createFromModelBuffer=function(t,e){return D(Le,t,{baseOptions:{modelAssetBuffer:e}})},Le.createFromOptions=function(t,e){return D(Le,t,e)};var Xi=class{constructor(t,e,s){this.confidenceMasks=t,this.categoryMask=e,this.qualityScores=s}close(){var t,e;(t=this.confidenceMasks)==null||t.forEach(s=>{s.close()}),(e=this.categoryMask)==null||e.close()}};Xi.prototype.close=Xi.prototype.close;var Qh=class extends w{constructor(t){super(t)}},Es=[0,le,-2],Sn=[0,Tt,-3,ae,Tt,-1],Fl=[0,Sn],Nl=[0,Sn,le,-1],yi=class extends w{constructor(t){super(t)}},Bl=[0,Tt,-1,ae],Yh=class extends w{constructor(t){super(t)}},Hl=class extends w{constructor(t){super(t)}},Zi=[1,2,3,4,5,6,7,8,9,10,14,15],gu=class extends w{constructor(t){super(t)}};gu.prototype.g=Wn([0,me,[0,Zi,W,Sn,W,[0,Sn,Es],W,Fl,W,[0,Fl,Es],W,Bl,W,[0,Tt,-3,ae,it],W,[0,Tt,-3,ae],W,[0,G,Tt,-2,ae,le,ae,-1,2,Tt,Es],W,Nl,W,[0,Nl,Es],Tt,Es,G,W,[0,Tt,-3,ae,Es,-1],W,[0,me,Bl]],G,[0,G,le,-1,ae]]);var xt=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect_in",!1),this.outputCategoryMask=!1,this.outputConfidenceMasks=!0,this.h=new eo,this.s=new Xc,C(this.h,0,3,this.s),C(t=this.h,0,1,e=new ne)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return"outputCategoryMask"in t&&(this.outputCategoryMask=t.outputCategoryMask??!1),"outputConfidenceMasks"in t&&(this.outputConfidenceMasks=t.outputConfidenceMasks??!0),super.l(t)}segment(t,e,s,a){const n=typeof s!="function"?s:{};this.j=typeof s=="function"?s:a,this.qualityScores=this.categoryMask=this.confidenceMasks=void 0,s=this.B+1,a=new gu;const i=new Hl;var r=new Qh;if(St(r,1,255),C(i,0,12,r),e.keypoint&&e.scribble)throw Error("Cannot provide both keypoint and scribble.");if(e.keypoint){var o=new yi;Aa(o,3,!0),$(o,1,e.keypoint.x),$(o,2,e.keypoint.y),ma(i,5,Zi,o)}else{if(!e.scribble)throw Error("Must provide either a keypoint or a scribble.");for(o of(r=new Yh,e.scribble))Aa(e=new yi,3,!0),$(e,1,o.x),$(e,2,o.y),xn(r,1,yi,e);ma(i,15,Zi,r)}xn(a,1,Hl,i),this.g.addProtoToStream(a.g(),"drishti.RenderData","roi_in",s),ot(this,t,n);e:{try{const d=new Xi(this.confidenceMasks,this.categoryMask,this.qualityScores);if(!this.j){var l=d;break e}this.j(d)}finally{Kn(this)}l=void 0}return l}m(){var t=new qe;ee(t,"image_in"),ee(t,"roi_in"),ee(t,"norm_rect_in");const e=new We;ut(e,eu,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.interactive_segmenter.InteractiveSegmenterGraph"),Y(s,"IMAGE:image_in"),Y(s,"ROI:roi_in"),Y(s,"NORM_RECT:norm_rect_in"),s.o(e),Qe(t,s),Yn(this,t),this.outputConfidenceMasks&&(U(t,"confidence_masks"),O(s,"CONFIDENCE_MASKS:confidence_masks"),Gs(this,"confidence_masks"),this.g.ca("confidence_masks",(a,n)=>{this.confidenceMasks=a.map(i=>Js(this,i,!0,!this.j)),v(this,n)}),this.g.attachEmptyPacketListener("confidence_masks",a=>{this.confidenceMasks=[],v(this,a)})),this.outputCategoryMask&&(U(t,"category_mask"),O(s,"CATEGORY_MASK:category_mask"),Gs(this,"category_mask"),this.g.U("category_mask",(a,n)=>{this.categoryMask=Js(this,a,!1,!this.j),v(this,n)}),this.g.attachEmptyPacketListener("category_mask",a=>{this.categoryMask=void 0,v(this,a)})),U(t,"quality_scores"),O(s,"QUALITY_SCORES:quality_scores"),this.g.attachFloatVectorListener("quality_scores",(a,n)=>{this.qualityScores=a,v(this,n)}),this.g.attachEmptyPacketListener("quality_scores",a=>{this.categoryMask=void 0,v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};xt.prototype.segment=xt.prototype.segment,xt.prototype.setOptions=xt.prototype.o,xt.createFromModelPath=function(t,e){return D(xt,t,{baseOptions:{modelAssetPath:e}})},xt.createFromModelBuffer=function(t,e){return D(xt,t,{baseOptions:{modelAssetBuffer:e}})},xt.createFromOptions=function(t,e){return D(xt,t,e)};var Ze=class extends je{constructor(t,e){super(new rt(t,e),"input_frame_gpu","norm_rect",!1),this.j={detections:[]},C(t=this.h=new tu,0,1,e=new ne)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return t.displayNamesLocale!==void 0?Q(this.h,2,Xs(t.displayNamesLocale)):"displayNamesLocale"in t&&Q(this.h,2),t.maxResults!==void 0?St(this.h,3,t.maxResults):"maxResults"in t&&Q(this.h,3),t.scoreThreshold!==void 0?$(this.h,4,t.scoreThreshold):"scoreThreshold"in t&&Q(this.h,4),t.categoryAllowlist!==void 0?vn(this.h,5,t.categoryAllowlist):"categoryAllowlist"in t&&Q(this.h,5),t.categoryDenylist!==void 0?vn(this.h,6,t.categoryDenylist):"categoryDenylist"in t&&Q(this.h,6),this.l(t)}D(t,e){return this.j={detections:[]},ot(this,t,e),this.j}F(t,e,s){return this.j={detections:[]},kt(this,t,s,e),this.j}m(){var t=new qe;ee(t,"input_frame_gpu"),ee(t,"norm_rect"),U(t,"detections");const e=new We;ut(e,Uh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.ObjectDetectorGraph"),Y(s,"IMAGE:input_frame_gpu"),Y(s,"NORM_RECT:norm_rect"),O(s,"DETECTIONS:detections"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("detections",(a,n)=>{for(const i of a)a=Ic(i),this.j.detections.push(au(a));v(this,n)}),this.g.attachEmptyPacketListener("detections",a=>{v(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ze.prototype.detectForVideo=Ze.prototype.F,Ze.prototype.detect=Ze.prototype.D,Ze.prototype.setOptions=Ze.prototype.o,Ze.createFromModelPath=async function(t,e){return D(Ze,t,{baseOptions:{modelAssetPath:e}})},Ze.createFromModelBuffer=function(t,e){return D(Ze,t,{baseOptions:{modelAssetBuffer:e}})},Ze.createFromOptions=function(t,e){return D(Ze,t,e)};var er=class{constructor(t,e,s){this.landmarks=t,this.worldLandmarks=e,this.segmentationMasks=s}close(){var t;(t=this.segmentationMasks)==null||t.forEach(e=>{e.close()})}};function Ul(t){t.landmarks=[],t.worldLandmarks=[],t.segmentationMasks=void 0}function Vl(t){try{const e=new er(t.landmarks,t.worldLandmarks,t.segmentationMasks);if(!t.s)return e;t.s(e)}finally{Kn(t)}}er.prototype.close=er.prototype.close;var Ue=class extends je{constructor(t,e){super(new rt(t,e),"image_in","norm_rect",!1),this.landmarks=[],this.worldLandmarks=[],this.outputSegmentationMasks=!1,C(t=this.h=new su,0,1,e=new ne),this.v=new Jc,C(this.h,0,3,this.v),this.j=new zc,C(this.h,0,2,this.j),St(this.j,4,1),$(this.j,2,.5),$(this.v,2,.5),$(this.h,4,.5)}get baseOptions(){return B(this.h,ne,1)}set baseOptions(t){C(this.h,0,1,t)}o(t){return"numPoses"in t&&St(this.j,4,t.numPoses??1),"minPoseDetectionConfidence"in t&&$(this.j,2,t.minPoseDetectionConfidence??.5),"minTrackingConfidence"in t&&$(this.h,4,t.minTrackingConfidence??.5),"minPosePresenceConfidence"in t&&$(this.v,2,t.minPosePresenceConfidence??.5),"outputSegmentationMasks"in t&&(this.outputSegmentationMasks=t.outputSegmentationMasks??!1),this.l(t)}D(t,e,s){const a=typeof e!="function"?e:{};return this.s=typeof e=="function"?e:s,Ul(this),ot(this,t,a),Vl(this)}F(t,e,s,a){const n=typeof s!="function"?s:{};return this.s=typeof s=="function"?s:a,Ul(this),kt(this,t,n,e),Vl(this)}m(){var t=new qe;ee(t,"image_in"),ee(t,"norm_rect"),U(t,"normalized_landmarks"),U(t,"world_landmarks"),U(t,"segmentation_masks");const e=new We;ut(e,Vh,this.h);const s=new Ee;Je(s,"mediapipe.tasks.vision.pose_landmarker.PoseLandmarkerGraph"),Y(s,"IMAGE:image_in"),Y(s,"NORM_RECT:norm_rect"),O(s,"NORM_LANDMARKS:normalized_landmarks"),O(s,"WORLD_LANDMARKS:world_landmarks"),s.o(e),Qe(t,s),Yn(this,t),this.g.attachProtoVectorListener("normalized_landmarks",(a,n)=>{this.landmarks=[];for(const i of a)a=Pa(i),this.landmarks.push(Qn(a));v(this,n)}),this.g.attachEmptyPacketListener("normalized_landmarks",a=>{this.landmarks=[],v(this,a)}),this.g.attachProtoVectorListener("world_landmarks",(a,n)=>{this.worldLandmarks=[];for(const i of a)a=Ds(i),this.worldLandmarks.push(xa(a));v(this,n)}),this.g.attachEmptyPacketListener("world_landmarks",a=>{this.worldLandmarks=[],v(this,a)}),this.outputSegmentationMasks&&(O(s,"SEGMENTATION_MASK:segmentation_masks"),Gs(this,"segmentation_masks"),this.g.ca("segmentation_masks",(a,n)=>{this.segmentationMasks=a.map(i=>Js(this,i,!0,!this.s)),v(this,n)}),this.g.attachEmptyPacketListener("segmentation_masks",a=>{this.segmentationMasks=[],v(this,a)})),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ue.prototype.detectForVideo=Ue.prototype.F,Ue.prototype.detect=Ue.prototype.D,Ue.prototype.setOptions=Ue.prototype.o,Ue.createFromModelPath=function(t,e){return D(Ue,t,{baseOptions:{modelAssetPath:e}})},Ue.createFromModelBuffer=function(t,e){return D(Ue,t,{baseOptions:{modelAssetBuffer:e}})},Ue.createFromOptions=function(t,e){return D(Ue,t,e)},Ue.POSE_CONNECTIONS=mu;const Kh="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",Xh="https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";let ps=null,oa=null,wi=0;function Gl(t,e=.16){const s=t.w*e,a=t.h*e,n=Math.max(0,t.x-s/2),i=Math.max(0,t.y-a/2);return{x:n,y:i,w:Math.min(1-n,t.w+s),h:Math.min(1-i,t.h+a)}}function Wl(t){const e=t.w*1.3,s=t.h*1.95,a=Math.max(0,t.x-(e-t.w)/2),n=Math.max(0,t.y-t.h*.28);return{x:a,y:n,w:Math.min(1-a,e),h:Math.min(1-n,s)}}function Zh(t,e){const s=e.videoWidth||1,a=e.videoHeight||1,n=t.boundingBox;if(n&&n.width>=8&&n.height>=8)return Wl(Gl({x:n.originX/s,y:n.originY/a,w:n.width/s,h:n.height/a},.06));const i=t.keypoints||[];if(i.length<4)return null;const r=i.some(g=>g.x>1.5||g.y>1.5),o=i.map(g=>r?g.x/s:g.x),l=i.map(g=>r?g.y/a:g.y),d=Math.min(...o),c=Math.max(...o),u=Math.min(...l),f=Math.max(...l),p=c-d,b=f-u;return p<.04||b<.05?null:Wl(Gl({x:d,y:u,w:p,h:b},.2))}function e0(){return!!ps}async function t0(){return ps?!0:oa?!!await oa:(oa=(async()=>{try{const t=await os.forVisionTasks(Kh),e={baseOptions:{modelAssetPath:Xh,delegate:"GPU"},runningMode:"VIDEO",minDetectionConfidence:.42,minSuppressionThreshold:.25};try{ps=await _e.createFromOptions(t,e)}catch{ps=await _e.createFromOptions(t,{...e,baseOptions:{...e.baseOptions,delegate:"CPU"}})}return ps}catch(t){return console.error("Face tracker failed to load",t),oa=null,null}})(),!!await oa)}function s0(t,e){if(!ps||!t.videoWidth)return[];const s=e<=wi?wi+1:e;wi=s;try{return(ps.detectForVideo(t,s).detections||[]).map(n=>Zh(n,t)).filter(n=>!!n).sort((n,i)=>i.w*i.h-n.w*n.h)}catch{return[]}}function a0(t,e,s=.5){return t?{x:t.x+(e.x-t.x)*s,y:t.y+(e.y-t.y)*s,w:t.w+(e.w-t.w)*s,h:t.h+(e.h-t.h)*s}:e}const zl=168,n0=128,i0=420;function Si(t,e,s){return Math.min(s,Math.max(e,t))}class r0{constructor(){h(this,"root",null);h(this,"stream",null);h(this,"ownStream",!1);h(this,"raf",0);h(this,"lastTick",0);h(this,"missingMs",0);h(this,"extraMs",0);h(this,"lastStatus","loading");h(this,"box",null);h(this,"pos",{x:0,y:72});h(this,"width",zl);h(this,"dragging",!1);h(this,"resizing",!1);h(this,"dragOffset",{x:0,y:0});h(this,"resizeStart",{x:0,width:zl});h(this,"blurBound",!1);h(this,"shotAt",0);h(this,"video",null)}mount(){this.root||(this.pos.x=Math.max(16,window.innerWidth-this.width-16),this.pos.y=72,this.root=document.createElement("div"),this.root.id="exam-camera-overlay",document.body.appendChild(this.root),this.paintShell(),this.bindDrag(),this.bindResize(),this.bindBlur(),t0(),this.initVideo().catch(e=>console.error("Exam camera failed",e)))}teardown(){var e,s;this.raf&&cancelAnimationFrame(this.raf),this.raf=0,this.ownStream&&((e=this.stream)==null||e.getTracks().forEach(a=>a.stop())),this.stream=null,this.ownStream=!1,this.video=null,(s=this.root)==null||s.remove(),this.root=null,this.missingMs=0,this.extraMs=0,this.box=null}paintShell(){if(!this.root)return;const e=x.getState(),s=e.settings.maxViolationsBeforeTerminate;this.root.innerHTML=`
      <div id="exam-cam-card" class="fixed z-[60] select-none" style="left:${this.pos.x}px;top:${this.pos.y}px;width:${this.width}px">
        <div class="relative rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden">
          <div id="exam-cam-handle" role="button" aria-label="Drag camera" class="cursor-grab active:cursor-grabbing px-1.5 py-1 flex items-center justify-between gap-1 bg-slate-900/95 border-b border-slate-800">
            <div class="flex items-center gap-1 min-w-0">
              <span class="text-slate-500 text-[10px] tracking-widest">⠿</span>
              <span class="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-red-500/15 border border-red-500/40">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-[9px] font-black tracking-wider text-red-400">REC</span>
              </span>
            </div>
            <span id="exam-cam-warns" class="text-[9px] font-bold text-slate-300 whitespace-nowrap">${e.violationCount}/${s}</span>
          </div>
          <div class="relative aspect-video bg-slate-900 overflow-hidden">
            <video id="proctor-pip-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform:scaleX(-1)"></video>
            <div id="exam-face-box" class="absolute rounded-md border-[3px] pointer-events-none" style="display:none"></div>
            <div id="exam-cam-fallback" class="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 text-lg">📷</div>
            <div id="exam-shot-flash" class="absolute inset-0 bg-white/70 opacity-0 pointer-events-none transition-opacity duration-150"></div>
            <div id="exam-cam-badge" class="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-700 text-white">Finding face</div>
          </div>
          <button type="button" id="exam-cam-resize" aria-label="Resize camera" title="Drag corner to resize" class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize text-slate-200 hover:text-white bg-slate-800/90 hover:bg-blue-600 rounded-tl-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M11 5V11H5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 8.5L8.5 11M11 6L6 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div id="exam-cam-toast" class="hidden mt-2 max-w-full rounded-xl border border-red-500/40 bg-red-950/95 px-3 py-2 shadow-xl">
          <p class="text-[10px] font-bold uppercase tracking-wider text-red-300">Warning</p>
          <p id="exam-cam-toast-copy" class="text-xs font-medium text-white"></p>
        </div>
      </div>
    `}card(){var e;return(e=this.root)==null?void 0:e.querySelector("#exam-cam-card")}bindDrag(){var i;const e=(i=this.root)==null?void 0:i.querySelector("#exam-cam-handle");if(!e)return;const s=r=>{if(!this.dragging)return;this.pos.x=Si(r.clientX-this.dragOffset.x,8,window.innerWidth-80),this.pos.y=Si(r.clientY-this.dragOffset.y,8,window.innerHeight-80);const o=this.card();o&&(o.style.left=`${this.pos.x}px`,o.style.top=`${this.pos.y}px`)},a=()=>{this.dragging&&(this.dragging=!1,e.classList.replace("cursor-grabbing","cursor-grab"),window.removeEventListener("pointermove",s),window.removeEventListener("mousemove",s),window.removeEventListener("pointerup",a),window.removeEventListener("mouseup",a))},n=r=>{r.button===0&&(this.dragging=!0,this.dragOffset.x=r.clientX-this.pos.x,this.dragOffset.y=r.clientY-this.pos.y,e.classList.replace("cursor-grab","cursor-grabbing"),window.addEventListener("pointermove",s),window.addEventListener("mousemove",s),window.addEventListener("pointerup",a),window.addEventListener("mouseup",a))};e.addEventListener("pointerdown",n),e.addEventListener("mousedown",n)}bindResize(){var i;const e=(i=this.root)==null?void 0:i.querySelector("#exam-cam-resize");if(!e)return;const s=r=>{this.resizing&&this.setWidth(this.resizeStart.width+(r.clientX-this.resizeStart.x))},a=()=>{this.resizing=!1,window.removeEventListener("pointermove",s),window.removeEventListener("mousemove",s),window.removeEventListener("pointerup",a),window.removeEventListener("mouseup",a)},n=r=>{r.preventDefault(),r.stopPropagation(),this.resizing=!0,this.resizeStart={x:r.clientX,width:this.width},window.addEventListener("pointermove",s),window.addEventListener("mousemove",s),window.addEventListener("pointerup",a),window.addEventListener("mouseup",a)};e.addEventListener("pointerdown",n),e.addEventListener("mousedown",n)}setWidth(e){const s=Si(e,n0,i0),a=this.pos.x+s-(window.innerWidth-8);a>0&&(this.pos.x=Math.max(8,this.pos.x-a)),this.width=s;const n=this.card();n&&(n.style.width=`${this.width}px`,n.style.left=`${this.pos.x}px`)}bindBlur(){this.blurBound||(this.blurBound=!0,window.addEventListener("blur",()=>{const e=x.getState();e.examStarted&&!e.examCompleted&&this.warn("Tab Switch","Window focus lost (tab switch or another window).","high")}))}async initVideo(){var n,i;const e=(n=this.root)==null?void 0:n.querySelector("#proctor-pip-video"),s=(i=this.root)==null?void 0:i.querySelector("#exam-cam-fallback"),a=x.getLiveCameraStream();try{this.stream=a||await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0}),this.ownStream=!a,this.stream&&x.registerMediaStream(this.stream),e&&this.stream&&(this.video=e,e.srcObject=this.stream,s&&(s.style.display="none"),await e.play().catch(()=>{}),this.startMonitor())}catch{s&&(s.textContent="Camera blocked")}}startMonitor(){this.raf&&cancelAnimationFrame(this.raf),this.lastTick=performance.now();const e=s=>{this.raf=requestAnimationFrame(e),this.tick(s)};this.raf=requestAnimationFrame(e)}tick(e){const s=this.video;if(!s||!s.videoWidth||!this.root)return;const a=Math.min(80,e-this.lastTick);this.lastTick=e;const n=x.getState();if(!e0()){this.paintFrame("loading",this.box,!1),this.paintChrome(n.violationCount,n.settings.maxViolationsBeforeTerminate);return}const i=s0(s,e),r=i[0]||null,o=!!r;let l=o?"in-frame":"out-of-frame";n.settings.detectMultipleFaces&&i.length>=2&&(l="multiple"),r&&(this.box=a0(this.box,r,.55)),this.paintFrame(l,this.box||r,!o),this.paintChrome(n.violationCount,n.settings.maxViolationsBeforeTerminate),n.examStarted&&!n.examCompleted&&(o?l==="multiple"?(this.extraMs+=a,this.missingMs=0,this.extraMs>=800&&(this.captureShot(s,"Another person was detected in the camera."),this.warn("Multiple Faces","Another face was recognized. Only the candidate may be in view.","high"),this.extraMs=0)):(this.missingMs=0,this.extraMs=0,this.lastStatus!=="in-frame"&&this.hideToast()):(this.missingMs+=a,this.extraMs=0,this.missingMs>=900&&(this.warn("No Face Detected","No face recognized. Look at the camera and stay in frame.","high"),this.missingMs=0)),this.lastStatus=l)}paintFrame(e,s,a){var te,K,Ye,De;const n=(te=this.root)==null?void 0:te.querySelector("#exam-face-box"),i=(K=this.root)==null?void 0:K.querySelector("#exam-cam-badge");if(!n||!i)return;const r={loading:"Finding face","in-frame":"Face locked","out-of-frame":"No face",multiple:"Other face"},o={loading:"bg-slate-700 text-white","in-frame":"bg-emerald-500 text-white","out-of-frame":"bg-red-600 text-white",multiple:"bg-amber-500 text-slate-950"};i.className=`absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${o[e]}`,i.textContent=r[e];const l=a||!s?{x:.06,y:.06,w:.88,h:.88}:s,d=n.parentElement,c=((Ye=this.video)==null?void 0:Ye.videoWidth)||640,u=((De=this.video)==null?void 0:De.videoHeight)||480,f=(d==null?void 0:d.clientWidth)||this.width,p=(d==null?void 0:d.clientHeight)||Math.round(this.width*9/16),b=c/u,g=f/Math.max(p,1);let y=f/c,I=0,M=0;g>b?(y=f/c,M=(p-u*y)/2):(y=p/u,I=(f-c*y)/2);const R=1-l.x-l.w;n.style.display="block",n.style.left=`${I+R*c*y}px`,n.style.top=`${M+l.y*u*y}px`,n.style.width=`${l.w*c*y}px`,n.style.height=`${l.h*u*y}px`;const k=a||e==="out-of-frame";n.style.borderColor=k?"#ef4444":e==="multiple"?"#f59e0b":"#22c55e",n.style.boxShadow=k?"0 0 0 999px rgba(239,68,68,0.16) inset":"0 0 0 1px rgba(34,197,94,0.35)"}paintChrome(e,s){var n;const a=(n=this.root)==null?void 0:n.querySelector("#exam-cam-warns");a&&(a.textContent=`${e}/${s}`)}showToast(e){var n,i;const s=(n=this.root)==null?void 0:n.querySelector("#exam-cam-toast"),a=(i=this.root)==null?void 0:i.querySelector("#exam-cam-toast-copy");!s||!a||(a.textContent=e,s.classList.remove("hidden"))}hideToast(){var e,s;(s=(e=this.root)==null?void 0:e.querySelector("#exam-cam-toast"))==null||s.classList.add("hidden")}warn(e,s,a){this.showToast(s),x.logProctoringViolation(e,s,a)}captureShot(e,s){var c;const a=Date.now();if(a-this.shotAt<8e3||!e.videoWidth)return;this.shotAt=a;const n=document.createElement("canvas"),i=480,r=Math.round(e.videoHeight/e.videoWidth*i)||270;n.width=i,n.height=r;const o=n.getContext("2d");if(!o)return;o.drawImage(e,0,0,i,r);const l=n.toDataURL("image/jpeg",.55);ba.sendSnapshot(l,s);const d=(c=this.root)==null?void 0:c.querySelector("#exam-shot-flash");d&&(d.style.opacity="1",window.setTimeout(()=>{d.style.opacity="0"},140))}}const xu=new r0;function o0(){xu.mount()}function Ga(){xu.teardown()}const Jl={aadhaar:"Aadhaar",pan:"PAN card",voter_id:"Voter ID"};class Ql{constructor(e){h(this,"container");h(this,"cameraStream",null);h(this,"isCameraPassed",!1);h(this,"isMicPassed",!1);h(this,"isNetworkPassed",!1);h(this,"isBrowserPassed",!1);h(this,"downloadMbps",0);h(this,"previewTarget","off");h(this,"singleMonitor",null);h(this,"screenWidth",0);h(this,"screenHeight",0);h(this,"isPhotoCaptured",!1);h(this,"isIdUploaded",!1);h(this,"photoJpeg","");h(this,"idJpeg","");h(this,"idType","");h(this,"savingPhoto",!1);h(this,"savingId",!1);this.container=e}async render(){this.container.innerHTML=`
      <div class="max-w-6xl mx-auto py-10 px-4">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>STEP 4 OF 5</span> • System Pre-Flight Diagnostics
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Candidate System Hardware & Network Verification</h1>
          <p class="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Camera, microphone, and internet speed are measured on this device. Download speed must be at least 5 Mbps.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 class="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Hardware & Permission Diagnostics</span>
                <button id="recheck-btn" class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300">
                  🔄 Re-test Hardware
                </button>
              </h2>

              <div id="cam-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">📷</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Webcam Access</h3>
                      <p class="text-xs text-slate-400">Live video frames from this device</p>
                    </div>
                  </div>
                  <div id="cam-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="cam-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="mic-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">🎙️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Microphone</h3>
                      <p id="mic-sub-text" class="text-xs text-slate-400">Checking that the microphone is on...</p>
                    </div>
                  </div>
                  <div id="mic-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="mic-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="net-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">⚡</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Internet Speed</h3>
                      <p id="net-sub-text" class="text-xs text-slate-400">Measuring download speed. Minimum 5 Mbps.</p>
                    </div>
                  </div>
                  <div id="net-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="net-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="browser-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">🖥️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Browser & Screen</h3>
                      <p id="browser-sub-text" class="text-xs text-slate-400">Checking resolution and monitors...</p>
                    </div>
                  </div>
                  <div id="browser-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Checking...</span>
                  </div>
                </div>
                <p id="browser-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>
              <p id="checks-save-status" class="text-[11px] text-slate-500 hidden"></p>
            </div>

            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Exam Integrity Terms & Declaration</h3>
              <ul class="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li>I understand that tab switching or exiting fullscreen will log a violation.</li>
                <li>I confirm that I am sitting alone in a well-lit environment without unauthorized materials.</li>
                <li>I accept continuous webcam, microphone, and screen monitoring during the assessment.</li>
              </ul>
              <label class="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 cursor-pointer">
                <input id="declaration-check" type="checkbox" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <span class="text-xs font-semibold text-slate-200">I have read, understood, and accept all exam proctoring guidelines.</span>
              </label>
            </div>
          </div>

          <div class="space-y-4">
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-3">
              <h3 id="camera-feed-title" class="text-xs font-bold text-slate-300 uppercase tracking-wider">Candidate photo</h3>
              <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video id="webcam-preview" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                <img id="face-still" alt="Captured candidate photo" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">📷</span>
                  <span class="text-xs font-medium">Initializing camera stream...</span>
                </div>
              </div>
              <p id="camera-mode-label" class="text-[11px] text-slate-400">Live camera. Capture your photo, then the camera turns off.</p>
              <button type="button" id="snap-photo-btn" class="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <span>📸</span> Snap Candidate Photo
              </button>
              <div id="photo-preview-box" class="hidden p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2">
                <span id="photo-preview-label">Candidate photo</span>
                <img id="cand-photo-img" alt="Candidate photo" class="w-10 h-10 rounded-lg object-cover border border-emerald-500/40" />
              </div>
              <p id="photo-save-status" class="text-[11px] font-semibold text-left hidden"></p>
            </div>

            <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> Government ID Capture
              </h3>
              <p class="text-[11px] text-slate-400">Choose the ID type. The same camera starts here. After you capture the card, the camera stays on.</p>
              <label class="block text-[11px] font-semibold text-slate-300" for="govt-id-type">Government ID type</label>
              <select id="govt-id-type" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100">
                <option value="">Choose a government ID</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN card</option>
                <option value="voter_id">Voter ID</option>
              </select>
              <div id="id-camera-box" class="hidden relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <video id="id-webcam" autoplay playsinline muted class="w-full h-full object-cover"></video>
                <img id="id-still" alt="Captured government ID" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="id-cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">💳</span>
                  <span class="text-xs font-medium">Starting camera...</span>
                </div>
              </div>
              <p id="id-camera-hint" class="text-[11px] text-slate-500">Camera is off until you choose an ID type.</p>
              <button type="button" id="snap-id-live-btn" disabled class="w-full py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 opacity-50 cursor-not-allowed">
                <span>📸</span> Capture ID
              </button>
              <div id="id-preview-box" class="hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between gap-2">
                <span id="id-preview-label">Government ID</span>
                <img id="id-card-img" alt="Government ID" class="w-10 h-10 rounded-lg object-cover border border-purple-500/40" />
              </div>
              <p id="id-save-status" class="text-[11px] font-semibold hidden"></p>
              <div id="stay-on-box" class="hidden space-y-2">
                <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
                <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
                  <video id="stay-on-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                </div>
              </div>
            </div>

            <button
              id="start-exam-btn"
              disabled
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER SECURE EXAM ENVIRONMENT</span>
              <span>➔</span>
            </button>
            <p id="gate-msg" class="text-xs font-semibold text-amber-400 text-center">Complete the checks, then save your photo and government ID.</p>
          </div>
        </div>
      </div>
    `,await this.runLiveDiagnostics(),this.attachEvents()}snapshot(){return{cameraPassed:this.isCameraPassed,microphonePassed:this.isMicPassed,microphoneDb:null,networkPassed:this.isNetworkPassed,pingMs:null,downloadMbps:this.isNetworkPassed?Math.round(this.downloadMbps*10)/10:null,browserPassed:this.isBrowserPassed,screenWidth:this.screenWidth,screenHeight:this.screenHeight,singleMonitor:this.singleMonitor}}async runLiveDiagnostics(){var o,l;const e=this.container.querySelector("#webcam-preview"),s=this.container.querySelector("#cam-placeholder");if(this.previewTarget!=="exam"&&this.stopCamera(),this.isPhotoCaptured)this.isCameraPassed=!0,this.isMicPassed=!0;else try{await this.startPreview("face");const d=(o=this.cameraStream)==null?void 0:o.getVideoTracks()[0];d&&d.readyState==="live"&&e&&e.videoWidth>0?(this.isCameraPassed=!0,this.updateBadge("#cam-status-badge",!0,"Live ✓"),this.hideError("#cam-err-msg")):(this.isCameraPassed=!1,this.updateBadge("#cam-status-badge",!1,"No frames ✖"),this.showError("#cam-err-msg","The webcam opened but no video frames arrived. Check that it is not in use by another app, then re-test."));const c=(l=this.cameraStream)==null?void 0:l.getAudioTracks()[0];if(c&&c.readyState==="live"&&c.enabled){this.isMicPassed=!0,this.updateBadge("#mic-status-badge",!0,"Live ✓");const u=this.container.querySelector("#mic-sub-text");u&&(u.textContent="Microphone is on."),this.hideError("#mic-err-msg")}else this.isMicPassed=!1,this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","No live microphone. Allow microphone access and re-test.")}catch{this.isCameraPassed=!1,this.isMicPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera permission denied or no camera found. Allow camera access in the address bar and re-test."),this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone permission denied or no microphone found. Allow microphone access and re-test."),s&&(s.innerHTML=`
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera permission denied</span>
        `)}try{if(navigator.onLine===!1)throw new Error("This device reports that it is offline.");this.downloadMbps=await this.measureDownloadMbps();const d=(Math.round(this.downloadMbps*10)/10).toFixed(1),c=this.container.querySelector("#net-sub-text");this.downloadMbps>=5?(this.isNetworkPassed=!0,this.updateBadge("#net-status-badge",!0,`${d} Mbps ✓`),c&&(c.textContent=`Download speed ${d} Mbps. Minimum is 5 Mbps.`),this.hideError("#net-err-msg")):(this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,`${d} Mbps ✖`),c&&(c.textContent=`Download speed ${d} Mbps.`),this.showError("#net-err-msg","Internet speed must be at least 5 Mbps. Move to a faster connection and re-test."))}catch(d){this.isNetworkPassed=!1,this.downloadMbps=0,this.updateBadge("#net-status-badge",!1,"Failed ✖");const c=d instanceof Error?d.message:"The speed test did not finish.";this.showError("#net-err-msg",c);const u=this.container.querySelector("#net-sub-text");u&&(u.textContent="Could not measure download speed.")}this.screenWidth=window.screen.width,this.screenHeight=window.screen.height;const a=window.screen.isExtended;this.singleMonitor=typeof a=="boolean"?!a:null;const n=this.singleMonitor===null?"monitor count not reported":this.singleMonitor?"one monitor":"more than one monitor",i=this.container.querySelector("#browser-sub-text");i&&(i.textContent=`Screen ${this.screenWidth}×${this.screenHeight} • ${n}`);const r=typeof document.documentElement.requestFullscreen=="function";if(this.screenWidth>=1024&&r&&this.singleMonitor!==!1)this.isBrowserPassed=!0,this.updateBadge("#browser-status-badge",!0,"Compatible ✓"),this.hideError("#browser-err-msg");else{this.isBrowserPassed=!1,this.updateBadge("#browser-status-badge",!1,"Failed ✖");const d=[];this.screenWidth<1024&&d.push("the screen must be at least 1024 px wide"),r||d.push("this browser cannot enter fullscreen"),this.singleMonitor===!1&&d.push("disconnect extra monitors and use a single screen"),this.showError("#browser-err-msg",d.join("; ")+".")}this.checkButtonState(),this.recordChecks()}waitForVideo(e){return e.videoWidth>0?Promise.resolve():new Promise(s=>{const a=()=>s();e.addEventListener("loadeddata",a,{once:!0}),window.setTimeout(a,2e3)})}stopCamera(){var e;(e=this.cameraStream)==null||e.getTracks().forEach(s=>s.stop()),this.cameraStream=null,this.previewTarget="off";for(const s of["#webcam-preview","#id-webcam"]){const a=this.container.querySelector(s);a&&(a.srcObject=null)}}async startPreview(e){this.stopCamera();const s=this.container.querySelector(e==="face"?"#webcam-preview":"#id-webcam"),a=this.container.querySelector(e==="face"?"#cam-placeholder":"#id-cam-placeholder");if(!s)throw new Error("Camera preview is not on the page.");const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0});this.cameraStream=n,this.previewTarget=e,x.registerMediaStream(n),s.classList.remove("hidden"),s.srcObject=n,await this.waitForVideo(s),a&&s.videoWidth>0&&(a.style.display="none")}async measureDownloadMbps(){const e=T.getCandidateToken(),s=performance.now(),a=await fetch(`${T.apiBase}/api/v1/candidate/speed-sample`,{cache:"no-store",headers:e?{Authorization:`Bearer ${e}`}:{}});if(!a.ok)throw new Error(`The speed test failed (${a.status}).`);const n=await a.arrayBuffer(),i=(performance.now()-s)/1e3;if(i<=0||n.byteLength<1e5)throw new Error("The speed test did not return enough data.");return n.byteLength*8/(i*1e6)}async recordChecks(){const e=this.container.querySelector("#checks-save-status");try{const s=await this.postIdentity("checks");e&&(e.textContent=`Checks saved for ${s.name} (${s.email}).`,e.className="text-[11px] font-semibold text-emerald-400")}catch(s){e&&(e.textContent=this.errorText(s),e.className="text-[11px] font-semibold text-red-400")}}updateBadge(e,s,a){const n=this.container.querySelector(e);n&&(n.innerHTML=`
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${s?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}">${a}</span>
      `)}showError(e,s){const a=this.container.querySelector(e);a&&(a.textContent=s,a.classList.remove("hidden"))}hideError(e){const s=this.container.querySelector(e);s&&s.classList.add("hidden")}checkButtonState(){const e=this.container.querySelector("#declaration-check"),s=this.container.querySelector("#start-exam-btn"),a=this.container.querySelector("#gate-msg");if(!s||!a)return;const n=this.isCameraPassed&&this.isMicPassed&&this.isNetworkPassed&&this.isBrowserPassed,i=!!(e!=null&&e.checked),r=this.isPhotoCaptured&&this.isIdUploaded&&!this.savingPhoto&&!this.savingId;n&&i&&r?(s.disabled=!1,s.classList.remove("opacity-50","cursor-not-allowed"),a.textContent="Checks passed. Photo and government ID are saved as JPEG.",a.className="text-xs font-semibold text-emerald-400 text-center"):(s.disabled=!0,s.classList.add("opacity-50","cursor-not-allowed"),n?r?(a.textContent="Accept the exam terms to continue.",a.className="text-xs font-semibold text-amber-400 text-center"):(a.textContent="Snap your photo and a government ID. Each one is saved as a JPEG when you click it.",a.className="text-xs font-semibold text-amber-400 text-center"):(a.textContent="Fix the failed camera, microphone, network, or screen check, then re-test.",a.className="text-xs font-semibold text-red-400 text-center"))}errorText(e){return e instanceof H||e instanceof Error?e.message:"Could not save. Please try again."}setStatus(e,s,a){const n=this.container.querySelector(e);n&&(n.textContent=s,n.className=`text-[11px] font-semibold ${a?"text-emerald-400":"text-red-400"}`,n.classList.remove("hidden"))}frameToJpeg(e,s,a){const i=s>960?960/s:1,r=document.createElement("canvas");r.width=Math.max(1,Math.round(s*i)),r.height=Math.max(1,Math.round(a*i));const o=r.getContext("2d");if(!o)throw new Error("This browser could not create the JPEG.");o.drawImage(e,0,0,r.width,r.height);const l=r.toDataURL("image/jpeg",.82);if(!l.startsWith("data:image/jpeg"))throw new Error("This browser could not encode a JPEG.");return l}captureVideoJpeg(e){if(!e.videoWidth)throw new Error("The camera has no picture yet. Allow the webcam and re-test.");return this.frameToJpeg(e,e.videoWidth,e.videoHeight)}async postIdentity(e,s){const a={kind:e,systemCheck:this.snapshot()};return s&&(a.image=s),e==="id"&&(a.idDocumentType=this.idType),T.fetchJson("/candidate/identity","POST",a,"candidate")}remember(e){x.registerCandidateIdentity(e.candidateId,e.livePhotoStored?this.photoJpeg:"",e.idProofStored?this.idJpeg:"",{name:e.name,email:e.email})}selectedIdType(){const e=this.container.querySelector("#govt-id-type"),s=(e==null?void 0:e.value)||"";return s in Jl?s:""}freezeFace(e){this.stopCamera();const s=this.container.querySelector("#webcam-preview"),a=this.container.querySelector("#face-still"),n=this.container.querySelector("#camera-mode-label"),i=this.container.querySelector("#snap-photo-btn");s&&s.classList.add("hidden"),a&&(a.src=e,a.classList.remove("hidden")),n&&(n.textContent="Camera off. Your photo is saved."),i&&(i.disabled=!0,i.classList.add("opacity-50","cursor-not-allowed"))}keepCameraOn(e){const s=this.container.querySelector("#id-webcam"),a=this.container.querySelector("#id-still"),n=this.container.querySelector("#id-camera-box"),i=this.container.querySelector("#id-camera-hint"),r=this.container.querySelector("#snap-id-live-btn"),o=this.container.querySelector("#stay-on-box"),l=this.container.querySelector("#stay-on-video");n==null||n.classList.remove("hidden"),s&&(s.classList.add("hidden"),s.srcObject=null),a&&(a.src=e,a.classList.remove("hidden")),o==null||o.classList.remove("hidden"),l&&this.cameraStream&&(l.srcObject=this.cameraStream),this.previewTarget="exam",i&&(i.textContent="ID saved. The camera is on and stays on."),r&&(r.disabled=!0,r.classList.add("opacity-50","cursor-not-allowed"))}async startIdCamera(){if(!this.isPhotoCaptured){this.setStatus("#id-save-status","Capture your photo first. The camera starts here after that.",!1);const n=this.container.querySelector("#govt-id-type");n&&(n.value=""),this.idType="";return}const e=this.container.querySelector("#id-camera-box"),s=this.container.querySelector("#id-camera-hint"),a=this.container.querySelector("#snap-id-live-btn");e==null||e.classList.remove("hidden"),s&&(s.textContent="Starting the camera..."),await this.startPreview("id"),s&&(s.textContent="Camera is on. Hold the ID up to this camera, then capture it."),a&&(a.disabled=!1,a.classList.remove("opacity-50","cursor-not-allowed"))}async savePhoto(e){const s=this.container.querySelector("#cand-photo-img"),a=this.container.querySelector("#photo-preview-box"),n=this.container.querySelector("#photo-preview-label");this.photoJpeg=e,s&&(s.src=e),a&&a.classList.remove("hidden"),n&&(n.textContent="Saving JPEG..."),this.savingPhoto=!0,this.isPhotoCaptured=!1,this.checkButtonState();try{const i=await this.postIdentity("photo",e);this.remember(i),this.isPhotoCaptured=i.livePhotoStored,this.isPhotoCaptured&&this.freezeFace(e),n&&(n.textContent="Saved as JPEG"),this.setStatus("#photo-save-status",`Photo saved for ${i.name} (${i.email}). Camera off.`,!0)}catch(i){this.isPhotoCaptured=!1,n&&(n.textContent="Not saved"),this.setStatus("#photo-save-status",this.errorText(i),!1)}finally{this.savingPhoto=!1,this.checkButtonState()}}async saveId(e){if(this.idType=this.selectedIdType(),!this.idType){this.setStatus("#id-save-status","Choose Aadhaar, PAN card, or Voter ID first.",!1);return}const s=this.container.querySelector("#id-card-img"),a=this.container.querySelector("#id-preview-box"),n=this.container.querySelector("#id-preview-label");this.idJpeg=e,s&&(s.src=e),a&&a.classList.remove("hidden"),n&&(n.textContent="Saving JPEG..."),this.savingId=!0,this.isIdUploaded=!1,this.checkButtonState();try{const i=await this.postIdentity("id",e);this.remember(i),this.isIdUploaded=i.idProofStored;const r=Jl[this.idType];this.isIdUploaded&&this.previewTarget==="id"&&this.keepCameraOn(e),n&&(n.textContent=`${r} saved as JPEG`),this.setStatus("#id-save-status",`${r} saved for ${i.name} (${i.email}). Camera is on.`,!0)}catch(i){this.isIdUploaded=!1,n&&(n.textContent="Not saved"),this.setStatus("#id-save-status",this.errorText(i),!1)}finally{this.savingId=!1,this.checkButtonState()}}attachEvents(){const e=this.container.querySelector("#declaration-check"),s=this.container.querySelector("#start-exam-btn"),a=this.container.querySelector("#recheck-btn"),n=this.container.querySelector("#snap-photo-btn"),i=this.container.querySelector("#webcam-preview"),r=this.container.querySelector("#snap-id-live-btn"),o=this.container.querySelector("#govt-id-type");n==null||n.addEventListener("click",()=>{(async()=>{if(!(!i||this.previewTarget!=="face"))try{const l=this.captureVideoJpeg(i);await this.savePhoto(l)}catch(l){this.setStatus("#photo-save-status",this.errorText(l),!1)}})()}),r==null||r.addEventListener("click",()=>{(async()=>{const l=this.container.querySelector("#id-webcam");if(!this.selectedIdType()){this.setStatus("#id-save-status","Choose Aadhaar, PAN card, or Voter ID first.",!1);return}if(!l||this.previewTarget!=="id"){this.setStatus("#id-save-status","Choose the ID type so the camera starts in this section.",!1);return}try{const d=this.captureVideoJpeg(l);await this.saveId(d)}catch(d){this.setStatus("#id-save-status",this.errorText(d),!1)}})()}),o==null||o.addEventListener("change",()=>{if(this.idType=this.selectedIdType(),!!this.idType){if(this.isIdUploaded&&this.idJpeg){this.saveId(this.idJpeg);return}this.startIdCamera().catch(l=>this.setStatus("#id-save-status",this.errorText(l),!1))}}),e==null||e.addEventListener("change",()=>this.checkButtonState()),a==null||a.addEventListener("click",()=>{this.runLiveDiagnostics().catch(l=>console.error("Hardware diagnostics failed",l))}),s==null||s.addEventListener("click",()=>{var c,u;if(!this.isPhotoCaptured||!this.isIdUploaded)return;const l=x.getState().activeCandidateId;if(!l)return;x.completeSystemCheck();const d=x.getState().candidates.find(f=>f.id===l);(d==null?void 0:d.identityStatus)==="approved"?(x.startExam(),(u=(c=document.documentElement).requestFullscreen)==null||u.call(c).catch(()=>{})):this.renderWaitingForApprovalScreen()})}renderWaitingForApprovalScreen(){var n;this.container.innerHTML=`
      <div class="max-w-xl mx-auto py-16 px-4 text-center">
        <div class="glass-panel p-8 rounded-3xl border border-amber-500/30 bg-slate-950/90 space-y-6 shadow-2xl">
          <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mx-auto animate-pulse">
            ⏳
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-white">Identity Verification Pending Proctor Approval</h2>
            <p class="text-xs text-slate-300 mt-2">
              Your live photo and government ID have been saved as JPEG files on your candidate record.
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold space-y-2">
            <p>Security protocol active: please stay on this screen.</p>
            <p class="text-slate-400 font-normal">Once a proctor verifies your photo and government ID, the exam will start.</p>
          </div>
          <div class="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waiting for proctor authorization...</span>
          </div>
          <div class="text-left space-y-2">
            <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
            <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
              <video id="wait-cam" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
            </div>
          </div>
        </div>
      </div>
    `;const e=this.container.querySelector("#wait-cam"),s=(n=this.cameraStream)!=null&&n.getVideoTracks().some(i=>i.readyState==="live")?this.cameraStream:null;e&&s?e.srcObject=s:e&&navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0}).then(i=>{this.cameraStream=i,x.registerMediaStream(i),e.srcObject=i}).catch(()=>{});const a=x.subscribe(()=>{var o,l;const i=x.getState().activeCandidateId,r=x.getState().candidates.find(d=>d.id===i);(r==null?void 0:r.identityStatus)==="approved"&&(a(),x.startExam(),(l=(o=document.documentElement).requestFullscreen)==null||l.call(o).catch(()=>{}))})}}function Yl(t){const e=Math.max(0,Math.floor(t)),s=Math.floor(e/3600),a=Math.floor(e%3600/60),n=e%60;return`${String(s).padStart(2,"0")}:${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`}const ve=class ve{constructor(e){h(this,"container");h(this,"selectedRating",0);h(this,"feedbackDraft","");this.container=e,this.attachFullscreenEnforcement()}attachFullscreenEnforcement(){var s;if(ve.fullscreenEnforcementBound)return;ve.fullscreenEnforcementBound=!0;const e=document.createElement("div");e.id="fullscreen-enforcer-overlay",e.className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center hidden",e.innerHTML=`
      <div class="glass-panel p-8 rounded-3xl border border-red-500/50 text-center max-w-lg space-y-6 shadow-2xl">
        <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-4xl animate-pulse">
          ⚠️
        </div>
        <div>
          <h2 id="fullscreen-enforcer-title" class="text-xl font-extrabold text-white">Fullscreen required</h2>
          <p id="fullscreen-enforcer-copy" class="text-sm text-slate-300 mt-2">
            The proctor has admitted you. Enter fullscreen to continue the assessment.
          </p>
        </div>
        <button id="resume-fullscreen-btn" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
          <span>🛡️ RE-ENTER FULLSCREEN TO RESUME</span>
        </button>
      </div>
    `,document.body.appendChild(e),(s=e.querySelector("#resume-fullscreen-btn"))==null||s.addEventListener("click",()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}),document.addEventListener("fullscreenchange",()=>{const a=x.getState(),n=a.candidateFeedback!==null||a.examCompleted;if(!a.examStarted||n){e.classList.add("hidden");return}const i=e.querySelector("#fullscreen-enforcer-title"),r=e.querySelector("#fullscreen-enforcer-copy");if(document.fullscreenElement)ve.wasFullscreen=!0,e.classList.add("hidden");else{if(e.classList.remove("hidden"),ve.wasFullscreen){is(),x.logProctoringViolation("Fullscreen Exit","Candidate left fullscreen lockdown","high");const o=x.getState(),l=o.violationCount,d=o.settings.maxViolationsBeforeTerminate;i&&(i.textContent=l>=d?"Exam closing":`Fullscreen warning ${l} of ${d}`),r&&(r.textContent=l>=d?"You left fullscreen too many times. The exam window is closing automatically.":`Leaving fullscreen is a warning. After ${d} warnings the exam closes automatically. Return to fullscreen to continue.`)}else i&&r&&(i.textContent="Fullscreen required",r.textContent="Enter fullscreen to continue the assessment.");ve.wasFullscreen=!1}})}render(){var s;const e=x.getState();(!e.examStarted||e.examCompleted)&&((s=document.getElementById("fullscreen-enforcer-overlay"))==null||s.classList.add("hidden"),ve.stopExamClock()),e.otpVerified?e.systemCheckCompleted?e.examStarted&&!e.examCompleted?(o0(),this.renderExamEngine(),ve.ensureExamClock()):e.examCompleted?(Ga(),this.renderCompletionScreen()):(Ga(),this.renderInstructionsScreen(),!e.assessmentReady&&e.activeCandidateId&&x.loadCandidateAssessment(e.activeAssessmentId)):(Ga(),new Ql(this.container).render().catch(n=>console.error("System check failed to render",n))):(Ga(),this.renderOtpVerification())}renderLanding(){const e=["admin","recruiter","proctor"];this.container.innerHTML=`
      <div class="relative overflow-hidden bg-slate-950 text-slate-100 transition-colors">
        
        <!-- Ambient SaaS Glow / Grid Backdrop -->
        <div class="absolute inset-0 saas-hero-mesh pointer-events-none opacity-80"></div>
        <div class="absolute inset-0 saas-grid-pattern opacity-40 pointer-events-none"></div>

        <!-- Hero Section -->
        <section class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div class="text-center max-w-3xl mx-auto space-y-5">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-slate-900/80 border-blue-500/20 text-blue-300 backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ConferED Enterprise Talent Assessment & Proctoring</span>
              <span class="opacity-40">•</span>
              <span class="font-mono text-[11px] text-amber-500 font-bold">SOC-2 Type II</span>
            </div>

            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
              Intelligent Talent Assessment & <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Live Proctoring</span>
            </h1>

            <p class="text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
              A unified enterprise suite by <strong class="font-bold text-orange-500">ConferED</strong> for talent acquisition, university exams, and automated technical evaluations with real-time AI supervision.
            </p>

            <!-- Trust / Feature Indicators -->
            <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-2 text-xs font-medium text-slate-400">
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>🛡️</span> 2FA Enforced IAM
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>⚡</span> Automated Coding IDE
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>👁️</span> Real-Time AI Monitor
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>🔒</span> Zero-Trust Lockdown
              </span>
            </div>
          </div>

          <!-- The 3 Workspaces Grid -->
          <div id="workspaces-section" class="mt-14 lg:mt-16">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                  STAFF WORKSPACES
                </p>
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  Choose your secure workspace
                </h2>
                <p class="text-xs sm:text-sm text-slate-400 mt-1">
                  Sign in with your administrator-provisioned account. Multi-factor email OTP is required on all portals.
                </p>
              </div>
              <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 3 Workspaces Active
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              ${e.map(s=>{const a=ya[s];return`
                  <div class="group relative rounded-3xl border transition-all duration-300 saas-card-hover flex flex-col justify-between p-7 bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-xl">
                    
                    <!-- Ambient Glow Accent on Hover -->
                    <div class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                         style="background:radial-gradient(circle at top, ${a.accentLight}, transparent 70%)"></div>

                    <div class="relative space-y-4">
                      <!-- Card Header & Icon -->
                      <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                             style="background:${a.accentLight}; border:1px solid ${a.accentBorder}">
                          ${a.icon}
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono"
                              style="background:${a.accentLight}; color:${a.accentColor}; border:1px solid ${a.accentBorder}">
                          ${a.badge}
                        </span>
                      </div>

                      <div>
                        <h3 class="text-xl font-bold tracking-tight text-white group-hover:text-blue-500 transition-colors">
                          ${a.name}
                        </h3>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                          ${a.tagline}
                        </p>
                      </div>

                      <!-- Key Capability Tags -->
                      <div class="pt-2 flex flex-wrap gap-1.5">
                        ${a.features.map(n=>`
                          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950/70 text-slate-300 border border-slate-800">
                            ${n}
                          </span>
                        `).join("")}
                      </div>
                    </div>

                    <!-- Card Action Button -->
                    <div class="relative pt-6 mt-6 border-t border-slate-800">
                      <button type="button" data-portal="${s}"
                              class="w-full py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group-hover:shadow-xl active:scale-[0.98] bg-gradient-to-r ${a.gradient} ${a.hoverGradient}">
                        <span>SIGN IN TO WORKSPACE</span>
                        <span class="transition-transform group-hover:translate-x-1">➔</span>
                      </button>
                    </div>
                  </div>
                `}).join("")}
            </div>
          </div>

          <!-- Enterprise Features Highlights -->
          <div class="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">💻</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Full Monaco Code IDE</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Multi-language coding sandbox with automated test case evaluation and syntax assistance.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">👁️</div>
              <h4 class="text-sm font-bold tracking-tight text-white">AI Vision Proctoring</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Real-time face tracking, multi-person detection, tab-switch interception, and tamper logs.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">🎙️</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Live Voice Intercom</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Direct two-way audio streaming allowing proctors to listen in and issue immediate verbal instructions.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">📊</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Dossier & Audit Trails</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Candidate scoring metrics, violation timeline playback, and exportable PDF audit dossiers.</p>
            </div>
          </div>

        </section>
      </div>
    `,this.container.querySelectorAll("[data-portal]").forEach(s=>{s.addEventListener("click",()=>{const a=s.getAttribute("data-portal");a&&$e.navigate(jt[a].path)})})}renderOtpVerification(){var l;const e=x.getState().candidateInviteToken;if(!e){this.renderLanding();return}this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6">
          <div class="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            🔑
          </div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Candidate Verification</h2>
            <p class="text-xs text-slate-400 mt-2">Enter the 6-digit verification OTP sent to your registered Email and Phone.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-left text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Verification Passcode (OTP)</label>
              <input id="otp-input" type="text" maxlength="6" value="" class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
            </div>

            <button type="button" id="verify-otp-btn" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all">
              VERIFY & CONTINUE ➔
            </button>
            <p id="otp-error" class="text-xs font-semibold text-red-400 hidden"></p>
            <p id="otp-info" class="text-xs font-semibold text-emerald-400 hidden"></p>
            <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get a code? Resend</button>
          </div>
        </div>
      </div>
    `;const s=this.container.querySelector("#otp-input"),a=this.container.querySelector("#verify-otp-btn"),n=this.container.querySelector("#otp-error");s==null||s.addEventListener("keydown",d=>{d.key==="Enter"&&(a==null||a.dispatchEvent(new Event("click")))});const i=this.container.querySelector("#otp-info"),r=d=>{i==null||i.classList.add("hidden"),n&&(n.textContent=d,n.classList.remove("hidden"))},o=d=>d instanceof H?d.message:"Something went wrong. Please try again.";a==null||a.addEventListener("click",async()=>{const d=a,c=s.value.replace(/\D/g,"");if(c.length!==6){r("Enter the 6-digit passcode from your email.");return}d.disabled=!0,d.textContent="VERIFYING...";try{const u=await T.candidateVerify(e,c);x.candidateVerified(u)}catch(u){r(o(u)),d.disabled=!1,d.textContent="VERIFY & CONTINUE ➔"}}),(l=this.container.querySelector("#resend-otp-btn"))==null||l.addEventListener("click",async d=>{const c=d.currentTarget;c.disabled=!0;try{const u=await T.candidateResendOtp(e);n==null||n.classList.add("hidden"),i&&(i.textContent="A new passcode was sent to "+u.otpDestination+"."+(u.devOtp?` (DEV OTP: ${u.devOtp})`:""),i.classList.remove("hidden"))}catch(u){r(o(u))}finally{c.disabled=!1}})}renderInstructionsScreen(){var r,o;const e=x.getState(),s=x.getActiveAssessment(),a=e.candidates.find(l=>l.id===e.activeCandidateId),n=e.systemCheckCompleted&&(a==null?void 0:a.identityStatus)!=="approved";if(!e.assessmentReady){this.container.innerHTML=`
        <div class="max-w-md mx-auto py-16 px-4 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your exam paper…</p>
          <p class="text-xs text-slate-400">Fetching sections and questions for this invitation.</p>
          <button id="retry-paper-btn" class="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Retry</button>
        </div>
      `,(r=this.container.querySelector("#retry-paper-btn"))==null||r.addEventListener("click",()=>{x.loadCandidateAssessment(e.activeAssessmentId)});return}const i=(s==null?void 0:s.sections)||[];this.container.innerHTML=`
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          ${n?`
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold">
              Identity is with the proctor. Stay on this screen. Your exam sections are ready below and will open after you are admitted.
            </div>
          `:""}
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Assessment Overview</span>
              <h1 class="text-2xl font-extrabold text-white mt-2">${(s==null?void 0:s.title)||"Technical Assessment"}</h1>
              <p class="text-xs text-slate-400 mt-1">${(s==null?void 0:s.description)||""}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold font-mono text-blue-400">${(s==null?void 0:s.totalDurationMinutes)||0} Mins</div>
              <span class="text-xs text-slate-400 font-medium">Total Duration</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${i.map((l,d)=>`
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section ${d+1}</span>
                <h3 class="text-xs font-bold text-white truncate">${l.name}</h3>
                <div class="text-xs font-mono text-blue-400 font-semibold">${l.timeLimitMinutes||0} Mins • ${(l.questions||[]).length} Questions</div>
              </div>
            `).join("")||'<p class="text-xs text-slate-500 col-span-full">No sections are on this paper yet. Ask the recruiter to assign questions in Assessment Builder.</p>'}
          </div>

          ${n?`
            <div class="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Waiting for proctor authorization…</span>
            </div>
          `:`
            <div class="pt-4 border-t border-slate-800 flex justify-end">
              <button id="goto-syscheck-btn" class="py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
                <span>PROCEED TO SYSTEM DIAGNOSTICS</span>
                <span>➔</span>
              </button>
            </div>
          `}
        </div>
      </div>
    `,(o=this.container.querySelector("#goto-syscheck-btn"))==null||o.addEventListener("click",()=>{!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),new Ql(this.container).render().catch(d=>console.error("System check failed to render",d))})}renderExamEngine(){var u,f;const e=x.getState(),s=x.getActiveAssessment();if(!e.assessmentReady||!s){this.container.innerHTML=`
        <div class="py-24 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your assessment…</p>
          <p class="text-xs text-slate-400">Keep your camera in view. The exam paper will appear in a moment.</p>
          <button id="retry-exam-paper-btn" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Reload paper</button>
        </div>
      `,(u=this.container.querySelector("#retry-exam-paper-btn"))==null||u.addEventListener("click",()=>{x.loadCandidateAssessment(e.activeAssessmentId)});return}const a=s.sections||[];let n=e.currentSectionIndex;(n<0||n>=a.length)&&(n=0);let i=a[n];if(i&&!(i.questions||[]).length){const p=a.findIndex(b=>(b.questions||[]).length>0);p>=0&&(n=p,i=a[p],e.currentSectionIndex=p,e.currentQuestionIndex=0)}const r=(i==null?void 0:i.questions)||[],o=r[e.currentQuestionIndex]||r[0];if(!i||!o){this.container.innerHTML=`
        <div class="max-w-2xl mx-auto py-16 px-4 space-y-4">
          <h2 class="text-lg font-extrabold text-white">${s.title||"Assessment"}</h2>
          <p class="text-sm text-slate-300">This exam has no questions yet. Reload the paper if the recruiter just assigned questions.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${a.map((p,b)=>`
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <p class="text-[10px] font-bold uppercase text-slate-500">Section ${b+1}</p>
                <p class="text-sm font-bold text-white">${p.name}</p>
                <p class="text-xs text-slate-400">${p.timeLimitMinutes||0} mins • ${(p.questions||[]).length} questions</p>
              </div>
            `).join("")}
          </div>
          <button id="retry-empty-paper-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Reload paper</button>
        </div>
      `,(f=this.container.querySelector("#retry-empty-paper-btn"))==null||f.addEventListener("click",()=>{x.loadCandidateAssessment(e.activeAssessmentId)});return}const l=x.getSectionRemainingSeconds(),d=Yl(l),c=l<120;if(this.container.innerHTML=`
      <div class="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950">
        <!-- Secure Exam Top Navigation Header -->
        <div class="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between sticky top-14 z-30">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                SECTION ${n+1} OF ${a.length}
              </span>
              <h2 class="text-sm font-bold text-white">${i.name}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                ${a.map((p,b)=>`
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${b===n?"bg-blue-600/20 text-blue-300 border-blue-500/40":b<n?"bg-slate-800 text-slate-500 border-slate-700":"bg-slate-900 text-slate-400 border-slate-800"}">${b+1}. ${p.name} · ${(p.questions||[]).length}q</span>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Section Timer & Section Navigation Controls -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
              <span class="text-xs text-slate-400 uppercase tracking-wider">Section Time:</span>
              <span id="exam-section-timer" class="text-base font-extrabold tabular-nums ${c?"text-red-400 animate-pulse":"text-blue-400"}">${d}</span>
            </div>

            <button id="finish-sec-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all">
              Complete Section ➔
            </button>
          </div>
        </div>

        <!-- Exam Workspace Main Body -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <!-- Left Question Description & Navigation Panel -->
          <div class="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 overflow-y-auto space-y-6 bg-slate-950">
            <div class="flex items-center justify-between">
              <!-- STRICT REQUIREMENT: NO MARKS OR POINTS DISPLAYED TO CANDIDATE -->
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                Question ${e.currentQuestionIndex+1} of ${i.questions.length}
              </span>
              <button id="flag-q-btn" class="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${e.flaggedQuestions.has(o.id)?"bg-amber-500/20 text-amber-300 border-amber-500/40":"bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}">
                🚩 ${e.flaggedQuestions.has(o.id)?"Flagged for Review":"Flag Question"}
              </button>
            </div>

            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">${o.title}</h3>
              <div class="prose prose-invert prose-sm text-slate-300 mt-3 space-y-2 whitespace-pre-line leading-relaxed">
                ${o.content}
              </div>
              ${l0(o)}
            </div>

            <!-- Answer Input Widget based on Question Type -->
            <div class="pt-4 border-t border-slate-800/80">
              ${this.renderAnswerWidget(o,e.candidateAnswers[o.id])}
            </div>

            <!-- Question Navigation Next / Prev Action Bar -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button id="prev-q-btn" ${e.currentQuestionIndex===0?'disabled class="px-4 py-2 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 text-xs font-bold cursor-not-allowed"':'class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"'}>
                ⬅ Previous Question
              </button>

              ${e.currentQuestionIndex<i.questions.length-1?`
                <button id="next-q-btn" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Next Question</span> <span>➔</span>
                </button>
              `:`
                <button id="next-sec-btn" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Submit Section & Proceed</span> <span>➔</span>
                </button>
              `}
            </div>

            <!-- Question Palette Map -->
            <div class="pt-4 border-t border-slate-800/80 space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Navigation Map:</span>
              <div class="flex flex-wrap gap-2">
                ${i.questions.map((p,b)=>{const g=e.candidateAnswers[p.id]!==void 0,y=e.flaggedQuestions.has(p.id),I=b===e.currentQuestionIndex;return`
                    <button data-qidx="${b}" class="q-map-btn w-8 h-8 rounded-lg text-xs font-bold transition-all border ${I?"bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30":y?"bg-amber-500/20 text-amber-300 border-amber-500/40":g?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"}">
                      ${b+1}
                    </button>
                  `}).join("")}
              </div>
            </div>
          </div>

          <!-- Right Interactive Code IDE / Essay Workspace -->
          <div class="lg:col-span-7 bg-slate-900/50 p-4 flex flex-col overflow-hidden">
            ${o.type==="coding"||o.type==="sql"?`
              <div id="monaco-container" class="w-full h-full"></div>
            `:o.type==="essay"?(()=>{const p=(e.candidateAnswers[o.id]||"").trim();return`
                  <div class="w-full h-full flex flex-col glass-panel p-5 rounded-2xl border border-slate-800">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Rich Text Essay Response Editor</span>
                      <span id="word-count" class="text-xs font-mono text-blue-400">${p?p.split(/\s+/).filter(Boolean).length:0} / ${o.essayMaxWords||500} words</span>
                    </div>
                    <textarea id="essay-editor" class="flex-1 w-full p-4 glass-input rounded-xl text-sm font-sans text-slate-100 border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 resize-none outline-none" placeholder="Type your response here... (Minimum ${o.essayMinWords||150} words requirement)">${e.candidateAnswers[o.id]||""}</textarea>
                  </div>
                `})():`
              <div class="w-full h-full flex items-center justify-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Select your answer in the question panel on the left.
              </div>
            `}
          </div>
        </div>

      </div>
    `,o.type==="coding"||o.type==="sql"){const p=this.container.querySelector("#monaco-container");p&&new Hu(p,o).render()}this.attachExamEvents(o)}renderAnswerWidget(e,s){if(e.type==="mcq"||e.type==="msq"){const a=e.options&&e.options.length>0?e.options:[],n=e.type==="msq"||e.selectionMode==="multi",i=n?Array.isArray(s)?s:[]:s;return`
        <div class="space-y-2.5">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${n?"Select all that apply:":"Select one option:"}</span>
          ${a.map((r,o)=>{const l=typeof r=="string"?`opt-${o+1}`:r.id||`opt-${o+1}`,d=typeof r=="string"?r:r.text||`Option ${o+1}`,c=n?i.includes(l):i===l||i===d;return`
              <label class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${c?"bg-blue-600/10 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/20":"bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700"}">
                <input type="${n?"checkbox":"radio"}" name="mcq-option" value="${l}" ${c?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500" />
                <span class="text-xs font-medium">${d}</span>
              </label>
            `}).join("")}
        </div>
      `}if(e.type==="drag_drop"){const a=[...e.options||[]],n=Array.isArray(s)&&s.length?s:a.map(r=>r.id),i=Object.fromEntries(a.map(r=>[r.id,r]));return`
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Drag items into the correct order:</span>
          <ul id="drag-list" class="space-y-2">
            ${n.map((r,o)=>{var l;return`
              <li draggable="true" data-drag-id="${r}" class="drag-item flex items-center gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 cursor-grab active:cursor-grabbing">
                <span class="text-slate-500 font-mono text-[10px] w-5">${o+1}</span>
                <span class="text-xs font-medium flex-1">${((l=i[r])==null?void 0:l.text)||r}</span>
                <span class="text-slate-600 text-sm">⠿</span>
              </li>
            `}).join("")}
          </ul>
        </div>
      `}return""}attachExamEvents(e){var r,o,l,d,c;this.container.querySelectorAll('input[name="mcq-option"]').forEach(u=>{u.addEventListener("change",()=>{if(e.type==="msq"||e.selectionMode==="multi"){const p=Array.from(this.container.querySelectorAll('input[name="mcq-option"]:checked')).map(b=>b.value);x.setAnswer(e.id,p)}else{const p=this.container.querySelector('input[name="mcq-option"]:checked');p&&x.setAnswer(e.id,p.value)}this.renderExamEngine()})});const s=this.container.querySelector("#drag-list");if(s){let u=null;s.querySelectorAll(".drag-item").forEach(f=>{f.addEventListener("dragstart",p=>{var b;u=f,(b=p.dataTransfer)==null||b.setData("text/plain",""),f.classList.add("opacity-50")}),f.addEventListener("dragend",()=>{f.classList.remove("opacity-50"),u=null;const p=Array.from(s.querySelectorAll(".drag-item")).map(b=>b.getAttribute("data-drag-id")||"");x.setAnswer(e.id,p,!1)}),f.addEventListener("dragover",p=>{p.preventDefault();const b=f;if(!u||u===b)return;const g=b.getBoundingClientRect(),y=p.clientY<g.top+g.height/2;s.insertBefore(u,y?b:b.nextSibling)})})}const a=this.container.querySelector("#essay-editor"),n=this.container.querySelector("#word-count");a&&a.addEventListener("input",()=>{const u=a.value,f=u.trim()?u.trim().split(/\s+/).filter(Boolean).length:0;n&&(n.textContent=`${f} / ${e.essayMaxWords||500} words`),x.setAnswer(e.id,u,!1)}),(r=this.container.querySelector("#flag-q-btn"))==null||r.addEventListener("click",()=>{x.toggleFlagQuestion(e.id),this.renderExamEngine()}),this.container.querySelectorAll(".q-map-btn").forEach(u=>{u.addEventListener("click",f=>{const p=parseInt(f.currentTarget.getAttribute("data-qidx")||"0",10);is();const b=x.getState();b.currentQuestionIndex=p,x.flushExamProgress(),this.renderExamEngine()})}),(o=this.container.querySelector("#prev-q-btn"))==null||o.addEventListener("click",()=>{is(),x.prevQuestion(),this.renderExamEngine()}),(l=this.container.querySelector("#next-q-btn"))==null||l.addEventListener("click",()=>{is(),x.nextQuestion(),this.renderExamEngine()});const i=()=>{this.renderCustomSubmitSectionModal()};(d=this.container.querySelector("#finish-sec-btn"))==null||d.addEventListener("click",i),(c=this.container.querySelector("#next-sec-btn"))==null||c.addEventListener("click",i)}renderCustomSubmitSectionModal(){var s,a;const e=document.createElement("div");e.id="sec-confirm-modal",e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 class="text-lg font-extrabold text-white">Complete & Submit Section?</h3>
            <p class="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to submit this section and proceed to the next section? You will not be able to revisit previous questions.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="cancel-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              Cancel & Continue Section
            </button>
            <button id="confirm-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all">
              Yes, Submit Section ➔
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(e),(s=e.querySelector("#cancel-sec-modal-btn"))==null||s.addEventListener("click",()=>{e.remove()}),(a=e.querySelector("#confirm-sec-modal-btn"))==null||a.addEventListener("click",()=>{e.remove(),is(),x.nextSection(),!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),this.render()})}static stopExamClock(){ve.clockId&&(window.clearInterval(ve.clockId),ve.clockId=0)}static ensureExamClock(){ve.clockId||(ve.clockId=window.setInterval(()=>{const e=x.getState();if(!e.examStarted||e.examCompleted){ve.stopExamClock();return}const s=x.getSectionRemainingSeconds(),a=document.getElementById("exam-section-timer");a&&(a.textContent=Yl(s),a.classList.toggle("text-red-400",s<120),a.classList.toggle("animate-pulse",s<120),a.classList.toggle("text-blue-400",s>=120)),s<=0&&(is(),x.nextSection())},250))}renderCompletionScreen(){const s=x.getState().candidateFeedback!==null,a=this.selectedRating>=1;this.container.innerHTML=`
      <div class="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <!-- Hardware Stopped & Exit Fullscreen Confirmation Badge -->
        <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Webcam & Microphone Closed • Fullscreen Lockdown Ended</span>
          </div>
          <span class="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/20">Camera OFF</span>
        </div>

        <div class="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center text-3xl animate-pulse-green">
            ✓
          </div>
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Assessment Submitted Successfully</h1>
            <p class="text-xs text-slate-300 mt-2">
              Your test responses and code submissions have been securely encrypted and transmitted to the hiring team.
            </p>
          </div>

          <!-- Strict Compliance Policy Notice (No Scores Displayed) -->
          <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-1.5">
            <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Candidate Evaluation Policy Notice
            </h4>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              In accordance with enterprise recruitment compliance standards, evaluation scores, section percentages, and recruiter comments are directly routed to the hiring committee and are not displayed on the candidate portal.
            </p>
          </div>

          <!-- Candidate Rating & Feedback Survey Form -->
          ${s?`
            <div class="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-4">
              <span class="text-3xl">🌟</span>
              <h4 class="text-sm font-extrabold uppercase tracking-wider text-emerald-300">Thank You for Your Feedback!</h4>
              <p class="text-xs text-slate-300">Your rating & feedback have been securely recorded. You may now safely exit the assessment environment.</p>

              <button id="exit-fullscreen-close-tab-btn" class="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
                <span>🔒 EXIT SECURE EXAM & CLOSE TAB</span>
              </button>
            </div>
          `:`
            <div id="feedback-section" class="pt-6 border-t border-slate-800/80 space-y-5 text-left">
              <div class="text-center">
                <h3 class="text-base font-extrabold text-white">Rate Your Assessment Experience</h3>
                <p class="text-xs text-slate-400 mt-1">Please take a moment to rate the platform and share your feedback.</p>
              </div>

              <!-- Interactive 5-Star Rating Selector -->
              <div class="flex justify-center items-center gap-3">
                ${[1,2,3,4,5].map(n=>`
                  <button type="button" data-star="${n}" class="star-btn text-3xl transition-transform hover:scale-125 focus:outline-none ${n<=this.selectedRating?"text-amber-400":"text-slate-700"}">
                    ★
                  </button>
                `).join("")}
              </div>
              <p class="text-center text-[11px] text-slate-500">A star rating is required.</p>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Comments (optional):</label>
                <textarea id="feedback-text" rows="3" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional comments">${this.feedbackDraft.replace(/</g,"&lt;")}</textarea>
              </div>

              <button id="submit-feedback-btn" type="button" ${a?"":"disabled"} class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all ${a?"hover:from-blue-500 hover:to-indigo-500":"opacity-50 cursor-not-allowed"}">
                SUBMIT AND EXIT
              </button>
            </div>
          `}

          <div class="pt-4 border-t border-slate-800">
            <p class="text-xs text-slate-500 font-mono">Reference Submission ID: SUB-2026-98412-SEC</p>
          </div>
        </div>
      </div>
    `,this.attachFeedbackEvents()}attachFeedbackEvents(){var s,a;(s=this.container.querySelector("#exit-fullscreen-close-tab-btn"))==null||s.addEventListener("click",()=>{Kl()}),(a=this.container.querySelector("#feedback-text"))==null||a.addEventListener("input",n=>{this.feedbackDraft=n.currentTarget.value}),this.container.querySelectorAll(".star-btn").forEach(n=>{n.addEventListener("click",i=>{const r=parseInt(i.currentTarget.getAttribute("data-star")||"0",10),o=this.container.querySelector("#feedback-text");this.feedbackDraft=(o==null?void 0:o.value)||this.feedbackDraft,this.selectedRating=r,this.renderCompletionScreen()})});const e=this.container.querySelector("#submit-feedback-btn");e==null||e.addEventListener("click",()=>{if(this.selectedRating<1)return;const n=this.container.querySelector("#feedback-text"),i=n?n.value.trim():this.feedbackDraft.trim();e.setAttribute("disabled","true"),x.finishAndClose(this.selectedRating,i),Kl()})}};h(ve,"clockId",0),h(ve,"fullscreenEnforcementBound",!1),h(ve,"wasFullscreen",!1);let kn=ve;function l0(t){if(t.type!=="coding"&&t.type!=="sql")return"";const e=(t.constraints||"").trim(),s=(t.ioFormat||"").trim();if(!e&&!s)return"";const a=(n,i)=>i?`
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${n}</p>
      <p class="text-xs text-slate-200 mt-1 whitespace-pre-line">${d0(i)}</p>
    </div>`:"";return`<div class="mt-4 space-y-2">${a("Constraints",e)}${a("Input / Output format",s)}</div>`}function d0(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Kl(){try{sessionStorage.removeItem("confered.candidateToken"),sessionStorage.removeItem("confered.examSnapshot")}catch{}document.fullscreenElement&&document.exitFullscreen&&document.exitFullscreen().catch(()=>{}),window.open("","_self"),window.close()}function c0(){var s,a;const t=document.getElementById("fullscreen-enforcer-overlay"),e=(a=(s=document.documentElement).requestFullscreen)==null?void 0:a.call(s);if(!e){t==null||t.classList.remove("hidden");return}e.catch(()=>t==null?void 0:t.classList.remove("hidden"))}const u0=Object.freeze(Object.defineProperty({__proto__:null,CandidatePortalModule:kn,requestExamFullscreen:c0},Symbol.toStringTag,{value:"Module"})),va={},Ca={},ln={},Qs={};let vu="",bo="",ha=null,Ct=null,yu="",Wa=0,yt=null;const tr=new Set;function p0(t){return`${T.apiBase.replace(/^http/,"ws")}/ws/proctoring?token=${encodeURIComponent(t)}`}function hs(){tr.forEach(t=>t())}function h0(t){const e=window.AudioContext||window.webkitAudioContext;if(!e)return;yt||(yt=new e({sampleRate:16e3})),yt.resume().catch(()=>{});const s=Uint8Array.from(atob(t),l=>l.charCodeAt(0)),a=new Int16Array(s.buffer,s.byteOffset,Math.floor(s.byteLength/2)),n=yt.createBuffer(1,a.length,16e3),i=n.getChannelData(0);for(let l=0;l<a.length;l++)i[l]=a[l]/32768;const r=yt.createBufferSource();r.buffer=n,r.connect(yt.destination);const o=yt.currentTime;Wa<o&&(Wa=o+.02),r.start(Wa),Wa+=n.duration}function wu(){const t=T.getStaffToken();!t||Ct&&Ct.readyState<=WebSocket.OPEN||(Ct=new WebSocket(p0(t)),Ct.onmessage=e=>{const s=JSON.parse(e.data);if(s.type==="inbox"&&s.threads)Object.assign(va,s.threads),hs();else if(s.type==="chat"&&s.candidateId){const a=va[s.candidateId]||(va[s.candidateId]=[]);a.some(n=>n.at===s.at&&n.text===s.text&&n.from===s.from)||(a.push({from:s.from,text:s.text,at:s.at}),s.from==="candidate"&&vu!==s.candidateId&&(Qs[s.candidateId]=(Qs[s.candidateId]||0)+1)),hs()}else s.type==="session_ended"?hs():s.type==="frame"&&s.candidateId&&typeof s.image=="string"?(Ca[s.candidateId]=s.image,document.querySelectorAll(`[data-live-frame="${s.candidateId}"]`).forEach(a=>{a.src=s.image,a.classList.remove("hidden")})):s.type==="mic"&&s.candidateId===yu&&typeof s.pcm=="string"?h0(s.pcm):s.type==="PROCTORING_EVENT"&&s.candidateId&&(ln[s.candidateId]=Number(s.violations||0),hs())},Ct.onclose=()=>{Ct=null})}function Su(t){return tr.add(t),()=>tr.delete(t)}function mo(t){!Ct||Ct.readyState!==WebSocket.OPEN||Ct.send(JSON.stringify(t))}function ki(t){yu=t,yt==null||yt.resume().catch(()=>{})}function sr(t){vu=t,t&&(Qs[t]=0),hs()}function fs(t){return bo===t}function $n(){ha==null||ha(),ha=null,bo="",hs()}async function ku(t){$n();const e=await navigator.mediaDevices.getUserMedia({audio:!0,video:!1}),s=new AudioContext({sampleRate:16e3}),a=s.createMediaStreamSource(e),n=s.createScriptProcessor(2048,1,1),i=s.createGain();i.gain.value=0,n.onaudioprocess=r=>{const o=r.inputBuffer.getChannelData(0),l=new Int16Array(o.length);for(let u=0;u<o.length;u++){const f=Math.max(-1,Math.min(1,o[u]));l[u]=f<0?f*32768:f*32767}const d=new Uint8Array(l.buffer);let c="";for(let u=0;u<d.length;u++)c+=String.fromCharCode(d[u]);mo({type:"audio",candidateId:t,pcm:btoa(c)})},a.connect(n),n.connect(i),i.connect(s.destination),bo=t,ha=()=>{n.disconnect(),a.disconnect(),e.getTracks().forEach(r=>r.stop()),s.close().catch(()=>{})},hs()}const Xl={aadhaar:"Aadhaar",pan:"PAN card",voter_id:"Voter ID"},Vt=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);async function Zl(t,e){const s=T.getStaffToken(),a=await fetch(`${T.apiBase}/api/v1/proctor/identity/${t}/${e}.jpg`,{headers:s?{Authorization:`Bearer ${s}`}:{}});if(!a.ok)throw new Error("missing");return URL.createObjectURL(await a.blob())}class f0{constructor(e){h(this,"container");h(this,"items",[]);h(this,"photos",{});h(this,"error","");h(this,"openChat","");h(this,"tab","pending");h(this,"stopWatch",null);this.container=e,this.stopWatch=Su(()=>{this.items.length&&this.paint()})}render(){if(wu(),!this.items.length&&!this.error){this.container.innerHTML='<p class="text-xs text-slate-400">Loading candidates who uploaded a photo or ID...</p>',this.load().catch(e=>{this.error=e instanceof Error?e.message:"Could not load the identity queue.",this.paint()});return}this.paint()}async load(){const e=await T.fetchJson("/proctor/identity","GET",void 0,"staff");this.items=e.items,await Promise.all(e.items.map(async s=>{const a=this.photos[s.id]||(this.photos[s.id]={});s.hasPhoto&&!a.face&&(a.face=await Zl(s.id,"photo").catch(()=>"")),s.hasId&&!a.id&&(a.id=await Zl(s.id,"id").catch(()=>""))})),this.paint()}paint(){const e=this.items.filter(s=>this.tab==="pending"?s.identityStatus!=="approved":s.identityStatus==="approved");this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="border-b border-slate-800 pb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Candidate photo and government ID</h2>
            <p class="text-xs text-slate-400 mt-1">Pending candidates can be admitted. Completed candidates move to live monitoring.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-tab="pending" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab==="pending"?"bg-blue-600 text-white":"bg-slate-800 text-slate-300"}">Pending</button>
            <button type="button" data-tab="completed" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab==="completed"?"bg-blue-600 text-white":"bg-slate-800 text-slate-300"}">Completed</button>
          </div>
        </div>
        ${this.error?`<p class="text-xs text-red-400">${Vt(this.error)}</p>`:""}
        ${e.length===0?`<p class="text-xs text-slate-500">${this.tab==="pending"?"No one is waiting.":"No one has been admitted yet."}</p>`:""}
        <div class="space-y-6">
          ${e.map(s=>this.tab==="pending"?this.pendingCard(s):this.completedCard(s)).join("")}
        </div>
      </div>
    `,this.bind()}pendingCard(e){const s=this.photos[e.id]||{},a=e.idDocumentType?Xl[e.idDocumentType]||e.idDocumentType:"Government ID",n=va[e.id]||[];return`
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">${Vt(e.name)}</h3>
            <p class="text-xs text-slate-300">${Vt(e.examTitle||"Assessment")}</p>
            <p class="text-xs text-slate-400">${Vt(e.email)}</p>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-amber-500/20 text-amber-400">Pending</span>
        </div>
        <div class="space-y-1">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Live camera</span>
          <div class="relative w-full max-w-sm aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            ${Ca[e.id]?`<img data-live-frame="${e.id}" src="${Ca[e.id]}" alt="" class="w-full h-full object-cover" />`:`<img data-live-frame="${e.id}" alt="" class="w-full h-full object-cover hidden" /><div class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Waiting for the candidate camera</div>`}
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot("Live photo",s.face)}
          ${this.shot(a,s.id)}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-admit="${e.id}" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
            Approve and admit
          </button>
          <button data-talk="${e.id}" class="px-4 py-2 rounded-xl text-xs font-bold border ${fs(e.id)?"bg-red-600 text-white border-red-500":"bg-purple-600/20 text-purple-300 border-purple-500/40"}">
            ${fs(e.id)?"Stop speaking":"Speak to candidate"}
          </button>
          <button data-chat="${e.id}" class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
            Chat
            ${Qs[e.id]?`<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${Qs[e.id]}</span>`:""}
          </button>
        </div>
        ${this.openChat===e.id?`
          <div class="rounded-xl border border-slate-800 bg-slate-950">
            <div class="h-40 overflow-y-auto p-3 space-y-2 text-xs" data-log="${e.id}">
              ${n.map(i=>`<div class="${i.from==="proctor"?"text-right":""}"><span class="inline-block px-2 py-1 rounded-lg ${i.from==="proctor"?"bg-purple-600 text-white":"bg-slate-800 text-slate-100"}">${Vt(i.text)}</span></div>`).join("")||'<p class="text-slate-500">No messages yet.</p>'}
            </div>
            <form data-send="${e.id}" class="flex gap-2 p-2 border-t border-slate-800">
              <input data-input="${e.id}" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Message the candidate" />
              <button class="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold" type="submit">Send</button>
            </form>
          </div>
        `:""}
      </div>
    `}completedCard(e){const s=this.photos[e.id]||{},a=e.idDocumentType?Xl[e.idDocumentType]||e.idDocumentType:"Government ID";return`
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div>
          <h3 class="text-sm font-bold text-white">${Vt(e.name)}</h3>
          <p class="text-xs text-slate-400">${Vt(e.examTitle||"Assessment")}</p>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot("Live photo",s.face)}
          ${this.shot(a,s.id)}
        </div>
      </div>
    `}shot(e,s){return`
      <div class="space-y-1">
        <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">${Vt(e)}</span>
        ${s?`<img src="${s}" class="w-40 h-28 rounded-xl object-cover border border-slate-700 bg-slate-950" />`:'<div class="w-40 h-28 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs">No image</div>'}
      </div>
    `}bind(){this.container.querySelectorAll("[data-tab]").forEach(e=>{e.addEventListener("click",()=>{this.tab=e.getAttribute("data-tab")||"pending",this.paint()})}),this.container.querySelectorAll("[data-admit]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-admit");s&&T.fetchJson(`/proctor/identity/${s}/admit`,"POST",{},"staff").then(()=>this.load()).catch(a=>{this.error=a instanceof Error?a.message:"Could not admit the candidate.",this.paint()})})}),this.container.querySelectorAll("[data-talk]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-talk")||"";fs(s)?$n():ku(s)})}),this.container.querySelectorAll("[data-chat]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-chat")||"";this.openChat=this.openChat===s?"":s,sr(this.openChat)})}),this.container.querySelectorAll("[data-send]").forEach(e=>{e.addEventListener("submit",s=>{s.preventDefault();const a=e.getAttribute("data-send")||"",n=e.querySelector("input"),i=(n==null?void 0:n.value.trim())||"";i&&(mo({type:"chat",candidateId:a,text:i}),n&&(n.value=""))})})}}const as=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function b0(t){const e=Math.max(0,t),s=Math.floor(e/60),a=e%60;return`${String(s).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function $i(t){if(!t.examStarted)return"Not started";const e=t.deadlineMs==null?t.timeLeftSeconds:Math.max(0,Math.round((t.deadlineMs-Date.now())/1e3));return`Time left ${b0(e)}`}const ds=class ds{constructor(e){h(this,"container");h(this,"items",[]);h(this,"listening",null);h(this,"chatOpen",!1);h(this,"timer",null);h(this,"tickTimer",null);h(this,"stopWatch",null);ds.current&&ds.current!==this&&ds.current.stop(),ds.current=this,this.container=e}render(){var e;if(Sa("proctor")==="identity-verification"){this.stop(),this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="proctor-section"></div></div>',new f0(this.container.querySelector("#proctor-section")).render();return}wu(),this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <p class="text-xs text-slate-400">Loading admitted candidates...</p>
      </div>
    `,this.load().catch(()=>this.paint("Could not load live sessions.")),this.timer||(this.timer=window.setInterval(()=>this.load().catch(()=>{}),5e3)),this.tickTimer||(this.tickTimer=window.setInterval(()=>this.tickClocks(),1e3)),(e=this.stopWatch)==null||e.call(this),this.stopWatch=Su(()=>{this.load().catch(()=>{})})}stop(){var e;this.timer&&window.clearInterval(this.timer),this.timer=null,this.tickTimer&&window.clearInterval(this.tickTimer),this.tickTimer=null,(e=this.stopWatch)==null||e.call(this),this.stopWatch=null,ki("")}tickClocks(){this.container.querySelectorAll("[data-clock]").forEach(e=>{const s=e.getAttribute("data-clock")||"",a=this.items.find(n=>n.id===s);a&&(e.textContent=$i(a))})}async load(){const e=await T.fetchJson("/proctor/live","GET",void 0,"staff"),s=Date.now();this.items=e.items.map(a=>({...a,examStarted:!!a.examStarted,deadlineMs:a.examStarted?s+Math.max(0,a.timeLeftSeconds)*1e3:null,violations:Math.max(a.violations,ln[a.id]||0)})),this.paint()}paint(e=""){var s,a,n,i;Sa("proctor")!=="identity-verification"&&(this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Proctor Surveillance Engine
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Live Candidate Monitor</h1>
            <p class="text-xs text-slate-400">Real-time candidate camera feeds and AI integrity tracking. Select any card to monitor audio or speak directly.</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feeds: <b class="text-emerald-400 font-bold">${this.items.length}</b>
            </span>
          </div>
        </div>
        ${e?`<p class="text-xs text-red-400">${as(e)}</p>`:""}
        ${this.items.length===0?'<p class="text-sm text-slate-500">No admitted candidates yet. Admit someone from Identity & ID Verification.</p>':""}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.items.map(r=>this.card(r)).join("")}
        </div>
        ${this.listening?this.popup(this.listening):""}
      </div>
    `,this.container.querySelectorAll("[data-open-live]").forEach(r=>{r.addEventListener("click",()=>{const o=r.getAttribute("data-open-live")||"";this.listening=this.items.find(l=>l.id===o)||null,ki(o),this.paint()})}),(s=this.container.querySelector("#close-live-popup"))==null||s.addEventListener("click",()=>{this.listening&&fs(this.listening.id)&&$n(),this.listening=null,this.chatOpen=!1,ki(""),sr(""),this.paint()}),(a=this.container.querySelector("[data-live-talk]"))==null||a.addEventListener("click",()=>{var o;const r=((o=this.listening)==null?void 0:o.id)||"";r&&(fs(r)?$n():ku(r))}),(n=this.container.querySelector("[data-live-chat]"))==null||n.addEventListener("click",()=>{this.chatOpen=!this.chatOpen,sr(this.chatOpen&&this.listening?this.listening.id:""),this.paint()}),(i=this.container.querySelector("#live-chat-form"))==null||i.addEventListener("submit",r=>{r.preventDefault();const o=this.container.querySelector("#live-chat-input"),l=(o==null?void 0:o.value.trim())||"";!l||!this.listening||(mo({type:"chat",candidateId:this.listening.id,text:l}),o&&(o.value=""))}))}card(e){const s=Ca[e.id],a=Math.max(e.violations,ln[e.id]||0);return`
      <button type="button" data-open-live="${e.id}" class="text-left glass-panel p-4 rounded-3xl border ${a?"border-amber-500/50":"border-slate-800"} space-y-3">
        <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          ${s?`<img data-live-frame="${e.id}" src="${s}" alt="" class="absolute inset-0 w-full h-full object-cover" />`:`<img data-live-frame="${e.id}" alt="" class="absolute inset-0 w-full h-full object-cover hidden" /><div class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Waiting for camera</div>`}
          <div class="absolute top-2 left-2 text-[10px] font-bold bg-slate-950/80 text-white px-2 py-0.5 rounded">${as(e.examTitle||"Assessment")}</div>
          <div class="absolute bottom-2 left-2 right-2 flex justify-between text-[11px] font-mono text-white">
            <span data-clock="${e.id}" class="bg-slate-950/80 px-2 py-0.5 rounded">${$i(e)}</span>
            <span class="bg-red-950/90 text-red-200 px-2 py-0.5 rounded">Violations ${a}</span>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">${as(e.name)}</h3>
          <p class="text-xs text-slate-400">${as(e.examTitle||"Assessment")}</p>
        </div>
      </button>
    `}popup(e){const s=Ca[e.id],a=va[e.id]||[],n=Qs[e.id]||0;return`
      <div class="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-white">${as(e.name)}</h2>
              <p class="text-xs text-slate-400">${as(e.examTitle||"Assessment")} • <span data-clock="${e.id}">${$i(e)}</span> • Violations ${Math.max(e.violations,ln[e.id]||0)}</p>
            </div>
            <button id="close-live-popup" class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200" type="button">Close</button>
          </div>
          <div class="relative w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden">
            ${s?`<img data-live-frame="${e.id}" src="${s}" alt="" class="w-full h-full object-cover" />`:`<img data-live-frame="${e.id}" alt="" class="w-full h-full object-cover hidden" />`}
          </div>
          <p class="text-xs font-semibold text-emerald-400">Listening to this candidate's microphone.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-live-talk class="px-4 py-2 rounded-xl text-xs font-bold ${fs(e.id)?"bg-red-600 text-white":"bg-purple-600/20 text-purple-200 border border-purple-500/40"}">
              ${fs(e.id)?"Stop speaking":"Speak to candidate"}
            </button>
            <button type="button" data-live-chat class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              Chat
              ${n?`<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${n}</span>`:""}
            </button>
          </div>
          ${this.chatOpen?`
            <div class="rounded-xl border border-slate-800 bg-slate-950">
              <div class="h-36 overflow-y-auto p-3 space-y-2 text-xs">
                ${a.map(i=>`<div class="${i.from==="proctor"?"text-right":""}"><span class="inline-block px-2 py-1 rounded-lg ${i.from==="proctor"?"bg-purple-600 text-white":"bg-slate-800 text-slate-100"}">${as(i.text)}</span></div>`).join("")||'<p class="text-slate-500">No messages yet.</p>'}
              </div>
              <form id="live-chat-form" class="flex gap-2 p-2 border-t border-slate-800">
                <input id="live-chat-input" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Message the candidate" />
                <button class="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold" type="submit">Send</button>
              </form>
            </div>
          `:""}
        </div>
      </div>
    `}};h(ds,"current",null);let ar=ds;class En{static downloadCsv(e,s,a){const n=[s.map(l=>`"${l}"`).join(","),...a.map(l=>l.map(d=>`"${String(d).replace(/"/g,'""')}"`).join(","))].join(`
`),i=new Blob([n],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(i),o=document.createElement("a");o.setAttribute("href",r),o.setAttribute("download",e),o.style.visibility="hidden",document.body.appendChild(o),o.click(),document.body.removeChild(o)}}class nr{static recordInvite(e,s,a,n,i){const r=(i==null?void 0:i.assessmentTitle)||"Assessment",o=(i==null?void 0:i.durationMinutes)??60,l={id:`email-${Date.now()}`,recipientEmail:s,recipientName:e,subject:`Invitation: ${r}`,bodyText:`Hello ${e}, you have been invited to ${r} (${o} min). Link: ${a}`,bodyHtml:"",otpCode:n||void 0,assessmentLink:a,assessmentTitle:r,durationMinutes:o,expiresAt:i==null?void 0:i.expiresAt,sentAt:new Date().toLocaleString(),status:"Delivered",provider:"Gmail SMTP (server-side)"};return this.sentEmails.unshift(l),l}static async sendTestEmail(e){const s="NexusAssess SMTP test",a="<p>This is a test email from the NexusAssess admin console.</p>",n={id:`email-${Date.now()}`,recipientEmail:e,recipientName:"Admin",subject:s,bodyText:"SMTP test email",bodyHtml:a,sentAt:new Date().toLocaleString(),status:"Delivering",provider:"Gmail SMTP (server-side)"};this.sentEmails.unshift(n);try{const i=await T.fetchJson("/recruiter/send-email","POST",{recipientEmail:e,recipientName:"Admin",subject:s,bodyHtml:a});return n.status=i.status==="success"?"Delivered":"Sent",i.status==="success"}catch{return n.status="Failed",!1}}static getSentEmails(){return this.sentEmails}}h(nr,"sentEmails",[]);const za=[{status:"Applied",slug:"applied",countKey:"applied"},{status:"Screened",slug:"screened",countKey:"screened"},{status:"Assessment Sent",slug:"assessment-sent",countKey:"assessmentSent"},{status:"Completed",slug:"completed",countKey:"completed"},{status:"Under Review",slug:"under-review",countKey:"underReview"},{status:"Selected",slug:"selected",countKey:"selected"},{status:"Rejected",slug:"rejected",countKey:"rejected"}],ke=t=>T.fetchJson(t,"GET"),lt=(t,e)=>T.fetchJson(t,"POST",e),m0=(t,e)=>T.fetchJson(t,"PUT",e),Ja=(t,e)=>T.fetchJson(t,"PATCH",e),la=t=>T.fetchJson(t,"DELETE"),j={pipeline:()=>ke("/recruiter/pipeline"),pipelineStage:t=>ke(`/recruiter/pipeline/stages/${t}`),candidate:t=>ke(`/recruiter/candidates/${t}`),setDecision:(t,e,s)=>Ja(`/recruiter/candidates/${t}/decision`,{decision:e,notes:s}),jobs:()=>ke("/recruiter/jobs"),job:t=>ke(`/recruiter/jobs/${t}`),createJob:t=>lt("/recruiter/jobs",t),updateJob:(t,e)=>Ja(`/recruiter/jobs/${t}`,e),deleteJob:t=>la(`/recruiter/jobs/${t}`),jobCategories:t=>ke(`/recruiter/jobs/${t}/categories`),createJobCategory:(t,e)=>lt(`/recruiter/jobs/${t}/categories`,{label:e}),createCategory:t=>lt("/recruiter/question-categories",{label:t}),createJobSection:(t,e)=>lt(`/recruiter/jobs/${t}/sections`,e),deleteJobCategory:(t,e)=>la(`/recruiter/jobs/${t}/categories/${e}`),jobQuestions:(t,e)=>{const s=new URLSearchParams;e!=null&&e.category&&s.set("category",e.category),e!=null&&e.type&&s.set("type",e.type);const a=s.toString()?`?${s}`:"";return ke(`/recruiter/jobs/${t}/questions${a}`)},createJobQuestion:(t,e)=>lt(`/recruiter/jobs/${t}/questions`,e),assessments:()=>ke("/recruiter/assessments"),assessment:t=>ke(`/recruiter/assessments/${t}`),createAssessment:t=>lt("/recruiter/assessments",t),updateAssessment:(t,e)=>Ja(`/recruiter/assessments/${t}`,e),deleteAssessment:t=>la(`/recruiter/assessments/${t}`),questions:t=>{const e=new URLSearchParams;t!=null&&t.category&&e.set("category",t.category),t!=null&&t.type&&e.set("type",t.type),t!=null&&t.difficulty&&e.set("difficulty",t.difficulty),t!=null&&t.q&&e.set("q",t.q),t!=null&&t.jobRole&&e.set("jobRole",t.jobRole),t!=null&&t.jobId&&e.set("jobId",t.jobId),t!=null&&t.scope&&e.set("scope",t.scope);const s=e.toString()?`?${e}`:"";return ke(`/recruiter/questions${s}`)},questionCategories:()=>ke("/recruiter/question-categories"),jobRoles:()=>ke("/recruiter/job-roles"),createJobRole:t=>lt("/recruiter/job-roles",t),deleteJobRole:t=>la(`/recruiter/job-roles/${t}`),question:t=>ke(`/recruiter/questions/${t}`),createQuestion:t=>lt("/recruiter/questions",t),updateQuestion:(t,e)=>Ja(`/recruiter/questions/${t}`,e),deleteQuestion:t=>la(`/recruiter/questions/${t}`),bulkImportQuestions:async(t,e)=>{const s=new FormData;return s.append("file",t),e&&s.append("jobId",e),T.uploadForm("/recruiter/questions/bulk/import",s)},downloadQuestionSample:()=>{const t=["Question,Section,Category,Content,Difficulty,Points,Options,CorrectAnswer,Job","What is 2+2?,Quantitative Aptitude,MCQ,Select the correct sum,easy,5,3|4|5|6,2,","Which figure comes next?,Logical Reasoning,MCQ,Choose the next figure in the series,medium,5,Circle|Square|Triangle,2,","Choose the correct sentence,English,MCQ,Pick the grammatically correct sentence,easy,5,He go home|He goes home|He going home,2,","What does JVM stand for?,Technical,MCQ,Choose the right expansion,easy,5,Java Virtual Machine|Java Variable Method|Just Virtual Memory,1,","Reverse a string,Technical,Coding,Write a function that returns the reversed string,medium,20,,,"].join(`
`),e=new Blob([t],{type:"text/csv;charset=utf-8"}),s=URL.createObjectURL(e),a=document.createElement("a");a.href=s,a.download="question_bank_sample.csv",a.click(),URL.revokeObjectURL(s)},updateSection:(t,e,s)=>m0(`/recruiter/assessments/${t}/sections/${e}`,s),eligibleQuestions:(t,e,s)=>{const a=s?`?q=${encodeURIComponent(s)}`:"";return ke(`/recruiter/assessments/${t}/sections/${e}/eligible-questions${a}`)},attachSectionQuestions:(t,e,s)=>lt(`/recruiter/assessments/${t}/sections/${e}/questions`,{questionIds:s}),bulkPreview:async(t,e)=>{const s=new FormData;return s.append("file",e),T.uploadForm(`/recruiter/assessments/${t}/invites/bulk/preview`,s)},bulkConfirm:(t,e)=>lt(`/recruiter/invites/batches/${t}/confirm`,e),bulkStatus:t=>ke(`/recruiter/invites/batches/${t}`),bulkRetryFailed:t=>lt(`/recruiter/invites/batches/${t}/retry-failed`)},ed=["mcq","msq","drag_drop","coding","sql","essay"],g0=["Quantitative Aptitude","Logical Reasoning","English","Technical"],x0=["MCQ","Theory","Coding"],$u=t=>t.type==="essay"?"Theory":t.type==="coding"||t.type==="sql"?"Coding":"MCQ",td=["draft","open","closed"];class v0{constructor(e){h(this,"container");h(this,"jobs",[]);h(this,"openJobId","");h(this,"openSection","");h(this,"questionsByJob",{});h(this,"loadingJobId","");h(this,"pendingStatus",{});h(this,"activeJobId","");h(this,"assessment",null);h(this,"jobQuestions",[]);h(this,"categories",[]);h(this,"loading",!0);h(this,"error","");this.container=e}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{const e=await j.jobs();this.jobs=e.items||[],this.openJobId&&!this.jobs.some(s=>s.id===this.openJobId)&&(this.openJobId="",this.openSection="")}catch(e){this.error=e instanceof H?e.message:"Could not load jobs.",this.jobs=[],this.assessment=null}finally{this.loading=!1,this.paint()}}activeJob(){return this.jobs.find(e=>e.id===this.activeJobId)||null}async loadActiveExam(){const e=this.activeJob();if(!e){this.assessment=null,this.jobQuestions=[];return}const[s,a]=await Promise.all([j.assessment(e.assessmentId),j.jobQuestions(e.id)]);this.assessment=s,this.jobQuestions=a.items||[]}paint(){if(this.loading){this.container.innerHTML='<p class="text-xs text-slate-500 font-mono py-8">Loading jobs…</p>';return}if(this.error){this.container.innerHTML=`<p class="text-xs text-red-400 font-semibold py-8">${z(this.error)}</p>`;return}this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-white">Jobs</h2>
            <p class="text-xs text-slate-400 mt-0.5">All jobs are listed here. Open a job to see its sections, then open a section to see its questions.</p>
          </div>
          <button id="add-job-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">+ Create job</button>
        </div>
        ${this.jobs.length?`
          <div class="space-y-3">
            ${this.jobs.map(e=>this.jobRow(e)).join("")}
          </div>
        `:'<p class="text-xs text-slate-500">No jobs yet. Create one to start an empty exam.</p>'}
      </div>
      <div id="admin-modal-host"></div>`,this.attachEvents()}jobRow(e){const s=e.id===this.openJobId,a=this.questionsByJob[e.id]||[],n=this.loadingJobId===e.id;return`
      <div class="rounded-2xl bg-slate-900 border ${s?"border-violet-500/40":"border-slate-800"}">
        <div class="flex items-start gap-3 p-4">
          <button data-job-toggle="${z(e.id)}" class="flex-1 min-w-0 text-left">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-slate-500 text-xs">${s?"▾":"▸"}</span>
              <span class="text-sm font-bold text-white">${z(e.title)}</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${w0(e.status)}">${z(e.status)}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 pl-5">${e.description?z(e.description):"No description yet."}</p>
          </button>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select data-job-status="${z(e.id)}" class="glass-input px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
              ${td.map(i=>`<option value="${i}" ${(this.pendingStatus[e.id]||e.status)===i?"selected":""}>${i}</option>`).join("")}
            </select>
            ${this.pendingStatus[e.id]&&this.pendingStatus[e.id]!==e.status?`<button data-job-save="${z(e.id)}" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">Save</button>`:""}
            <button data-job-edit="${z(e.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700">Edit</button>
            <button data-job-del="${z(e.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
          </div>
        </div>
        ${s?`
          <div class="px-4 pb-4 space-y-2">
            ${n?'<p class="text-xs text-slate-500 pl-5">Loading sections…</p>':g0.map(i=>this.sectionRow(e.id,i,a)).join("")}
          </div>
        `:""}
      </div>`}sectionRow(e,s,a){const n=a.filter(r=>(r.sectionCategory||"")===s),i=e===this.openJobId&&this.openSection===s;return`
      <div class="rounded-xl border border-slate-800 bg-slate-950/60">
        <button data-section-toggle="${z(s)}" class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
          <span class="text-sm font-semibold text-white"><span class="text-slate-500 mr-2">${i?"▾":"▸"}</span>${z(s)}</span>
          <span class="text-xs font-mono text-slate-400"><b class="text-purple-400">${n.length}</b> questions</span>
        </button>
        ${i?`
          <div class="px-4 pb-4 space-y-3">
            ${n.length?x0.map(r=>{const o=n.filter(l=>$u(l)===r);return o.length?`
                <div class="space-y-1.5 pl-5">
                  <p class="text-[11px] font-bold text-indigo-300">${z(r)}</p>
                  ${o.map(l=>y0(l)).join("")}
                </div>`:""}).join(""):'<p class="text-[11px] text-slate-500 pl-5">No questions in this section yet. Assign them from the Question Bank.</p>'}
          </div>
        `:""}
      </div>`}attachEvents(){var e;(e=this.container.querySelector("#add-job-btn"))==null||e.addEventListener("click",()=>this.renderJobModal()),this.container.querySelectorAll("[data-job-toggle]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-toggle")||"";n&&this.toggleJob(n)})}),this.container.querySelectorAll("[data-section-toggle]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-section-toggle")||"";this.openSection=this.openSection===n?"":n,this.paint()})}),this.container.querySelectorAll("[data-job-edit]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-edit")||"",i=this.jobs.find(r=>r.id===n);i&&this.renderJobModal(i)})}),this.container.querySelectorAll("[data-job-del]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-del")||"",i=this.jobs.find(r=>r.id===n);i&&confirm(`Delete “${i.title}” and its exam?`)&&this.deleteJob(i)})}),this.container.querySelectorAll("[data-job-status]").forEach(s=>{s.addEventListener("change",a=>{const n=a.currentTarget.getAttribute("data-job-status")||"",i=a.currentTarget.value,r=this.jobs.find(o=>o.id===n);r&&(i===r.status?delete this.pendingStatus[n]:this.pendingStatus[n]=i,this.paint())})}),this.container.querySelectorAll("[data-job-save]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-save")||"",i=this.jobs.find(o=>o.id===n),r=this.pendingStatus[n];i&&r&&this.setStatus(i,r)})}),this.container.querySelectorAll("[data-sec-edit]").forEach(s=>{s.addEventListener("click",a=>{var r;const n=a.currentTarget.getAttribute("data-sec-edit"),i=(r=this.assessment)==null?void 0:r.sections.find(o=>o.id===n);i&&this.renderSectionModal(i)})}),this.container.querySelectorAll("[data-sec-del]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-sec-del");n&&confirm("Delete this section from the exam?")&&this.deleteSection(n)})})}async toggleJob(e){if(this.openJobId===e){this.openJobId="",this.openSection="",this.paint();return}this.openJobId=e,this.openSection="",this.activeJobId=e,this.loadingJobId=e,this.paint();try{const s=await j.jobQuestions(e);this.questionsByJob[e]=s.items||[]}catch(s){this.questionsByJob[e]=[],alert(s instanceof H?s.message:"Could not load this job.")}finally{this.loadingJobId=""}this.paint()}async selectJob(e){this.activeJobId=e,this.loading=!0,this.paint();try{await this.loadActiveExam(),this.error=""}catch(s){this.error=s instanceof H?s.message:"Could not open this job.",this.assessment=null}finally{this.loading=!1,this.paint()}}async setStatus(e,s){try{const a=await j.updateJob(e.id,{status:s});this.jobs=this.jobs.map(n=>n.id===a.id?a:n),delete this.pendingStatus[e.id],this.paint()}catch(a){alert(a instanceof H?a.message:"Could not update status."),this.paint()}}async deleteJob(e){try{await j.deleteJob(e.id),this.jobs=this.jobs.filter(s=>s.id!==e.id),delete this.questionsByJob[e.id],this.openJobId===e.id&&(this.openJobId="",this.openSection=""),this.paint()}catch(s){alert(s instanceof H?s.message:"Could not delete this job.")}}renderJobModal(e){var i,r,o;const s=this.container.querySelector("#admin-modal-host");if(!s)return;const a=!!e;s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">${a?"Edit job":"Create job"}</h3>
            <button id="close-job-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="job-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="job-title" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Senior Software Engineer" value="${z((e==null?void 0:e.title)||"")}" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Description</label>
              <textarea id="job-desc" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="What this hire will do">${z((e==null?void 0:e.description)||"")}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Status</label>
              <select id="job-modal-status" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                ${td.map(l=>`<option value="${l}" ${((e==null?void 0:e.status)||"draft")===l?"selected":""}>${l}</option>`).join("")}
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-job-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"Save":"Create"}</button>
            </div>
          </form>
        </div>
      </div>`;const n=()=>{s.innerHTML=""};(i=s.querySelector("#close-job-modal"))==null||i.addEventListener("click",n),(r=s.querySelector("#close-job-modal-2"))==null||r.addEventListener("click",n),(o=s.querySelector("#job-form"))==null||o.addEventListener("submit",l=>{l.preventDefault(),this.saveJob(e,s,n)})}async saveJob(e,s,a){const n=s.querySelector("#job-title").value.trim(),i=s.querySelector("#job-desc").value.trim(),r=s.querySelector("#job-modal-status").value;if(!n)return alert("Enter a job title.");try{const o=e?await j.updateJob(e.id,{title:n,description:i,status:r}):await j.createJob({title:n,description:i,status:r});this.activeJobId=o.id,a(),await this.load()}catch(o){alert(o instanceof H?o.message:"Could not save the job.")}}async persistSections(e){var a;if(!this.assessment)return;this.assessment=await j.updateAssessment(this.assessment.id,{sections:e});const s=this.activeJob();s&&(s.sectionCount=((a=this.assessment.sections)==null?void 0:a.length)||0),this.paint()}async deleteSection(e){if(!this.assessment)return;const s=this.assessment.sections.filter(a=>a.id!==e);try{await this.persistSections(s)}catch(a){alert(a instanceof H?a.message:"Delete failed.")}}renderSectionModal(e){var c,u,f,p,b;const s=this.container.querySelector("#admin-modal-host");if(!s||!this.assessment)return;const a=!!e,n=new Set((e==null?void 0:e.allowedTypes)||[]),i=new Set((e==null?void 0:e.allowedCategories)||[]),r=((e==null?void 0:e.questions)||[]).map(g=>g.id);s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white">${a?"Modify Section":"Add Section"}</h3>
            <button id="close-sec-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="sec-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section Name</label>
              <input id="sec-name" value="${z((e==null?void 0:e.name)||"")}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Technical MCQs" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Instructions</label>
              <textarea id="sec-inst" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Complete all questions in this section.">${z((e==null?void 0:e.instructions)||"")}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="sec-time" value="${(e==null?void 0:e.timeLimitMinutes)??""}" placeholder="15" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Passing Points</label>
                <input type="number" id="sec-pass" value="${(e==null?void 0:e.passingMarks)??""}" placeholder="20" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed question types</p>
              <div class="flex flex-wrap gap-2">
                ${ed.map(g=>`
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-type" value="${g}" ${n.has(g)?"checked":""} /> ${g}
                  </label>`).join("")}
              </div>
            </div>
            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed categories</p>
              <div class="flex flex-wrap gap-2">
                ${this.categories.length?this.categories.map(g=>`
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-cat" value="${z(g.label)}" ${i.has(g.label)?"checked":""} /> ${z(g.label)}
                  </label>`).join(""):'<p class="text-amber-300 text-[11px]">This job has no categories yet. Add them in the question bank below.</p>'}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Pick N random (blank = all)</label>
                <input type="number" id="sec-pick" value="${(e==null?void 0:e.pickCount)??""}" min="1" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. 20" />
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" id="sec-rand" ${e!=null&&e.randomizeQuestions?"checked":""} /> Randomize question order
                </label>
              </div>
            </div>

            ${a?`
              <div class="border-t border-slate-800 pt-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-300">Assign questions <span id="pool-count" class="text-slate-500 font-mono"></span></p>
                    <p class="text-[11px] text-slate-500 mt-1">Tick questions from this job or the company library. Uncheck to remove one from the section. The question stays in its bank. Type and category limits apply to this list after you save them.</p>
                  </div>
                  <input id="elig-search" placeholder="Search…" class="glass-input w-48 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div class="flex flex-wrap gap-2">
                  ${["all","job","library"].map(g=>`
                    <button type="button" data-src="${g}" class="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border ${g==="all"?"bg-violet-600 text-white border-violet-500":"bg-slate-900 text-slate-400 border-slate-700"}">${g==="all"?"All":g==="job"?"This job":"Library"}</button>
                  `).join("")}
                </div>
                <div id="elig-list" class="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-800 p-2 bg-slate-950/50"></div>
                <input type="hidden" id="sec-pool-ids" value="${z(r.join(","))}" />
                <div class="rounded-xl border border-slate-800 p-3 space-y-2 bg-slate-950/40">
                  <p class="font-semibold text-slate-300">Create on this job and attach</p>
                  ${this.categories.length?`
                    <div class="grid grid-cols-2 gap-2">
                      <input id="new-q-title" placeholder="Question title" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <select id="new-q-type" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${ed.map(g=>`<option value="${g}">${g}</option>`).join("")}
                      </select>
                      <select id="new-q-cat" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${this.categories.map(g=>`<option value="${z(g.label)}">${z(g.label)}</option>`).join("")}
                      </select>
                      <input id="new-q-content" placeholder="Question text" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <div id="new-q-options" class="grid grid-cols-2 gap-2">
                      <input id="new-q-opt-a" placeholder="Option A" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <input id="new-q-opt-b" placeholder="Option B (correct)" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <button type="button" id="create-attach-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Create and attach</button>
                  `:'<p class="text-amber-300 text-[11px]">Add a category in this job’s question bank before creating a question here.</p>'}
                </div>
              </div>
            `:'<p class="text-[11px] text-slate-500">Save the section first, then assign questions to it.</p>'}

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-sec-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"SAVE":"ADD"}</button>
            </div>
          </form>
        </div>
      </div>`;let o=!1;const l=()=>{s.innerHTML=""},d=()=>{s.innerHTML="",o&&this.load()};if((c=s.querySelector("#close-sec-modal-btn"))==null||c.addEventListener("click",d),(u=s.querySelector("#close-sec-modal-btn-2"))==null||u.addEventListener("click",d),(f=s.querySelector("#sec-form"))==null||f.addEventListener("submit",g=>{g.preventDefault(),this.saveSection(e,s,l)}),a&&e){this.refreshEligible(e,s,"all"),(p=s.querySelector("#elig-search"))==null||p.addEventListener("input",()=>{var R;const M=((R=s.querySelector(".pool-src.bg-violet-600"))==null?void 0:R.getAttribute("data-src"))||"all";this.refreshEligible(e,s,M)}),s.querySelectorAll(".pool-src").forEach(M=>{M.addEventListener("click",()=>{s.querySelectorAll(".pool-src").forEach(R=>{R.className="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-slate-900 text-slate-400 border-slate-700"}),M.className="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-violet-600 text-white border-violet-500",this.refreshEligible(e,s,M.getAttribute("data-src")||"all")})});const g=s.querySelector("#new-q-type"),y=s.querySelector("#new-q-options"),I=()=>{const M=(g==null?void 0:g.value)||"";y==null||y.classList.toggle("hidden",!(M==="mcq"||M==="msq"))};g==null||g.addEventListener("change",I),I(),(b=s.querySelector("#create-attach-btn"))==null||b.addEventListener("click",()=>{this.createAndAttach(e,s).then(M=>{M&&(o=!0)})})}}async refreshEligible(e,s,a){var l;if(!this.assessment)return;const n=((l=s.querySelector("#elig-search"))==null?void 0:l.value)||"",i=s.querySelector("#elig-list"),r=s.querySelector("#sec-pool-ids");if(!i||!r)return;const o=new Set(r.value.split(",").filter(Boolean));try{const{items:d}=await j.eligibleQuestions(this.assessment.id,e.id,n||void 0),c=d.filter(f=>a==="job"?!!f.jobId:a==="library"?!f.jobId:!0);i.innerHTML=c.map(f=>`
        <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
          <input type="checkbox" class="pool-q" value="${z(f.id)}" ${o.has(f.id)?"checked":""} />
          <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${Eu(f.type)}">${z(f.type)}</span>
          <span class="text-slate-200 truncate">${z(f.title)}</span>
          <span class="ml-auto shrink-0 text-[10px] font-bold ${f.jobId?"text-indigo-300":"text-slate-500"}">${f.jobId?"This job":"Library"}</span>
        </label>`).join("")||'<p class="text-slate-500 px-2 py-2">Nothing to assign. Add questions in this job’s bank or the company library.</p>';const u=()=>{var M;const f=new Set(Array.from(i.querySelectorAll(".pool-q")).map(R=>R.value)),p=new Set(Array.from(i.querySelectorAll(".pool-q:checked")).map(R=>R.value));f.forEach(R=>{p.has(R)?o.add(R):o.delete(R)}),r.value=Array.from(o).join(",");const b=s.querySelector("#pool-count"),g=(M=s.querySelector("#sec-pick"))==null?void 0:M.value.trim(),y=g?parseInt(g,10):o.size,I=y>0?Math.min(y,o.size):o.size;b&&(b.textContent=`(${o.size} assigned, serving ${I})`)};i.querySelectorAll(".pool-q").forEach(f=>f.addEventListener("change",u)),u()}catch(d){i.innerHTML=`<p class="text-red-400 px-2">${z(d instanceof H?d.message:"Failed to load")}</p>`}}async createAndAttach(e,s){var d;const a=this.activeJob();if(!a||!this.assessment)return;const n=s.querySelector("#new-q-title").value.trim(),i=s.querySelector("#new-q-content").value.trim(),r=s.querySelector("#new-q-type").value,o=s.querySelector("#new-q-cat").value;if(!n)return alert("Enter a question title.");const l={type:r,title:n,content:i||n,sectionCategory:o,category:o,difficulty:"medium",points:10,status:"published"};if(r==="mcq"||r==="msq"){const c=s.querySelector("#new-q-opt-a").value.trim(),u=s.querySelector("#new-q-opt-b").value.trim();if(!c||!u)return alert("Enter two options. Option B is the correct one.");l.selectionMode=r==="msq"?"multi":"single",l.options=[{id:"a",text:c},{id:"b",text:u}],l.correctAnswers=r==="msq"?["a","b"]:["b"]}try{const c=await j.createJobQuestion(a.id,l),u=s.querySelector("#sec-pool-ids"),f=new Set((u.value||"").split(",").filter(Boolean));f.add(c.id),u.value=Array.from(f).join(","),await j.attachSectionQuestions(this.assessment.id,e.id,[c.id]),s.querySelector("#new-q-title").value="",s.querySelector("#new-q-content").value="";const p=((d=s.querySelector(".pool-src.bg-violet-600"))==null?void 0:d.getAttribute("data-src"))||"all";return await this.refreshEligible(e,s,p),!0}catch(c){return alert(c instanceof H?c.message:"Could not create the question."),!1}}async saveSection(e,s,a){var p;if(!this.assessment)return;const n=s.querySelector("#sec-name").value.trim(),i=s.querySelector("#sec-inst").value,r=parseInt(s.querySelector("#sec-time").value,10)||15,o=parseInt(s.querySelector("#sec-pass").value,10)||20,l=Array.from(s.querySelectorAll(".sec-type:checked")).map(b=>b.value),d=Array.from(s.querySelectorAll(".sec-cat:checked")).map(b=>b.value),c=s.querySelector("#sec-pick").value.trim(),u=c?parseInt(c,10):null,f=s.querySelector("#sec-rand").checked;try{if(e){const b=(((p=s.querySelector("#sec-pool-ids"))==null?void 0:p.value)||"").split(",").filter(Boolean);await j.updateSection(this.assessment.id,e.id,{name:n,instructions:i,timeLimitMinutes:r,passingMarks:o,allowedTypes:l,allowedCategories:d,pickCount:u,randomizeQuestions:f,questionIds:b}),await this.load()}else{const b=[...this.assessment.sections||[]];b.push({id:`sec-${Date.now()}`,name:n,description:n,instructions:i,timeLimitMinutes:r,passingMarks:o,isMandatory:!0,questions:[],allowedTypes:l,allowedCategories:d,pickCount:u,randomizeQuestions:f}),await this.persistSections(b),await this.load()}a()}catch(b){alert(b instanceof H?b.message:"Save failed.")}}}const y0=t=>`
  <div class="flex items-center gap-2 text-xs">
    <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${Eu(t.type)}">${z($u(t))}</span>
    <span class="text-slate-200 truncate">${z(t.title)}</span>
    <span class="ml-auto text-slate-500 shrink-0">${z(t.difficulty)} · ${t.points} pts</span>
  </div>`,z=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Eu=t=>t==="coding"?"bg-blue-500/20 text-blue-300":t==="sql"?"bg-purple-500/20 text-purple-300":t==="essay"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/20 text-emerald-300",w0=t=>t==="open"?"bg-emerald-500/15 text-emerald-300 border-emerald-500/30":t==="closed"?"bg-amber-500/15 text-amber-300 border-amber-500/30":"bg-slate-800 text-slate-300 border-slate-700";class sd{constructor(e,s,a=""){h(this,"host");h(this,"assessmentId");h(this,"jobTitle");h(this,"batch",null);h(this,"forceResend",!1);h(this,"pollTimer",null);h(this,"busy",!1);h(this,"error","");this.host=e,this.assessmentId=s,this.jobTitle=a}open(){this.batch=null,this.error="",this.forceResend=!1,this.paint()}destroy(){this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=null,this.host.innerHTML=""}paint(){const e=this.batch,s=e&&["queued","processing"].includes(e.status);this.host.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-white">Bulk Invite</h3>
              <p class="text-xs text-slate-400 mt-0.5">Upload .xlsx / .xls / .csv — Name + Email required${this.jobTitle?` · ${ns(this.jobTitle)}`:""}</p>
            </div>
            <button id="bulk-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          ${e?`
            <div class="flex flex-wrap gap-2 text-[11px] font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Valid ${e.validRows}</span>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">File dupes ${e.duplicateInFile}</span>
              <span class="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/20">DB dupes ${e.duplicateInDb}</span>
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${e.totalRows}</span>
              ${e.sent!=null?`<span class="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20">Sent ${e.sent}</span>`:""}
              ${e.failed!=null?`<span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${e.failed}</span>`:""}
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 uppercase">${ns(e.status)}</span>
            </div>

            ${e.status==="preview"?`
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input id="bulk-force" type="checkbox" ${this.forceResend?"checked":""} class="rounded border-slate-600" />
                Resend to candidates who already have an active invite
              </label>
            `:""}

            ${s||e.status==="completed"?`
              <div class="space-y-2">
                ${Ei("Sent",e.sent||0,e.totalRows,"bg-blue-500")}
                ${Ei("Failed",e.failed||0,e.totalRows,"bg-red-500")}
                ${Ei("Skipped",e.skipped||0,e.totalRows,"bg-amber-500")}
              </div>
            `:""}

            <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-64">
              <table class="w-full text-[11px]">
                <thead class="bg-slate-900 text-slate-400 sticky top-0">
                  <tr>
                    <th class="text-left px-3 py-2">#</th>
                    <th class="text-left px-3 py-2">Name</th>
                    <th class="text-left px-3 py-2">Email</th>
                    <th class="text-left px-3 py-2">Status</th>
                    <th class="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.rows.map(a=>`
                    <tr class="border-t border-slate-800/80">
                      <td class="px-3 py-1.5 text-slate-500 font-mono">${a.rowNumber}</td>
                      <td class="px-3 py-1.5 text-white">${ns(a.name)}</td>
                      <td class="px-3 py-1.5 text-slate-300">${ns(a.email)}</td>
                      <td class="px-3 py-1.5"><span class="px-1.5 py-0.5 rounded ${k0(a.deliveryStatus)}">${ns(a.deliveryStatus)}</span></td>
                      <td class="px-3 py-1.5 text-red-400">${ns((a.validationErrors||[]).join("; ")||a.dedupeReason||a.errorMessage||"")}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>
          `:`
            <label id="bulk-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
              <span class="text-3xl">📤</span>
              <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
              <span class="text-[11px] text-slate-500">Columns: Name, Email, Phone, Organisation, Role, Source. Role is the open job. Source is Campus Hire, Regular, or Referral.</span>
              <input id="bulk-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" />
            </label>
          `}

          ${this.error?`<p class="text-xs text-red-400 font-semibold">${ns(this.error)}</p>`:""}

          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button type="button" id="bulk-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">
              Download sample template
            </button>
            <div class="flex gap-3">
              <button id="bulk-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
              ${(e==null?void 0:e.status)==="preview"?`
                <button id="bulk-confirm" ${this.busy?"disabled":""} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs">
                  ${this.busy?"Sending…":"Confirm & Dispatch"}
                </button>
              `:""}
              ${e&&(e.failed||0)>0&&e.status==="completed"?`
                <button id="bulk-retry" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">Retry Failed</button>
              `:""}
            </div>
          </div>
        </div>
      </div>`,this.bind()}bind(){var n,i,r,o,l,d;const e=()=>this.destroy();(n=this.host.querySelector("#bulk-close"))==null||n.addEventListener("click",e),(i=this.host.querySelector("#bulk-close-2"))==null||i.addEventListener("click",e),(r=this.host.querySelector("#bulk-sample"))==null||r.addEventListener("click",()=>S0());const s=this.host.querySelector("#bulk-file"),a=this.host.querySelector("#bulk-drop");s==null||s.addEventListener("change",()=>{var u;const c=(u=s.files)==null?void 0:u[0];c&&this.preview(c)}),a==null||a.addEventListener("dragover",c=>{c.preventDefault()}),a==null||a.addEventListener("drop",c=>{var f,p;c.preventDefault();const u=(p=(f=c.dataTransfer)==null?void 0:f.files)==null?void 0:p[0];u&&this.preview(u)}),(o=this.host.querySelector("#bulk-force"))==null||o.addEventListener("change",c=>{this.forceResend=c.target.checked}),(l=this.host.querySelector("#bulk-confirm"))==null||l.addEventListener("click",()=>void this.confirm()),(d=this.host.querySelector("#bulk-retry"))==null||d.addEventListener("click",()=>void this.retry())}async preview(e){this.error="",this.busy=!0,this.paint();try{this.batch=await j.bulkPreview(this.assessmentId,e)}catch(s){this.error=s instanceof H?s.message:"Upload failed."}finally{this.busy=!1,this.paint()}}async confirm(){if(this.batch){this.busy=!0,this.error="",this.paint();try{this.batch=await j.bulkConfirm(this.batch.batchId,{forceResend:this.forceResend,expiresInHours:48}),this.startPoll()}catch(e){this.error=e instanceof H?e.message:"Confirm failed."}finally{this.busy=!1,this.paint()}}}async retry(){if(this.batch)try{this.batch=await j.bulkRetryFailed(this.batch.batchId),this.startPoll(),this.paint()}catch(e){this.error=e instanceof H?e.message:"Retry failed.",this.paint()}}startPoll(){this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=window.setInterval(async()=>{if(this.batch)try{this.batch=await j.bulkStatus(this.batch.batchId),this.paint(),(this.batch.status==="completed"||this.batch.status==="failed")&&(this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=null)}catch{}},2e3)}}const S0=()=>{const t=["Name,Email,Phone,Organisation,Role,Source","Jane Doe,jane.doe@example.com,+1-555-0100,State University,DevOps Engineer,Campus Hire","Alex Chen,alex.chen@example.com,+1-555-0101,Tech Corp,Senior Software Engineer,Referral","Priya Shah,priya.shah@example.com,+1-555-0102,City College,DevOps Engineer,Regular"].join(`
`),e=new Blob([t],{type:"text/csv;charset=utf-8"}),s=URL.createObjectURL(e),a=document.createElement("a");a.href=s,a.download="bulk_invite_sample.csv",a.click(),URL.revokeObjectURL(s)},ns=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),k0=t=>t==="SENT"?"bg-blue-500/20 text-blue-300":t==="FAILED"?"bg-red-500/20 text-red-300":t==="DUPLICATE_SKIPPED"?"bg-amber-500/20 text-amber-300":t==="COMPLETED"||t==="STARTED"?"bg-emerald-500/20 text-emerald-300":"bg-slate-800 text-slate-400",Ei=(t,e,s,a)=>{const n=s?Math.round(e/s*100):0;return`
    <div class="flex items-center gap-3 text-[11px]">
      <span class="w-14 text-slate-400 font-bold">${t}</span>
      <div class="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
        <div class="h-full ${a}" style="width:${n}%"></div>
      </div>
      <span class="w-10 text-right font-mono text-slate-300">${e}</span>
    </div>`};class $0{constructor(e,s){h(this,"container");h(this,"candidateId");h(this,"row",null);h(this,"error","");h(this,"loading",!0);this.container=e,this.candidateId=s}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{this.row=await j.candidate(this.candidateId)}catch(e){this.error=e instanceof Error?e.message:"Could not load candidate.",this.row=null}finally{this.loading=!1,this.paint()}}paint(){var n,i,r,o,l,d,c;if(this.loading){this.container.innerHTML='<div class="max-w-5xl mx-auto py-16 text-center text-xs text-slate-500 font-mono">Loading candidate…</div>';return}if(this.error||!this.row){this.container.innerHTML=`
        <div class="max-w-5xl mx-auto py-16 px-4 space-y-4 text-center">
          <p class="text-sm text-red-400 font-semibold">${this.error||"Candidate not found."}</p>
          <button id="cd-back" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs">Back to pipeline</button>
        </div>`,(n=this.container.querySelector("#cd-back"))==null||n.addEventListener("click",()=>$e.navigate(ka("recruiter")));return}const e=this.row,s=e.result;this.container.innerHTML=`
      <div class="max-w-5xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <button id="cd-back" class="text-xs font-semibold text-blue-400 hover:text-blue-300">Back to pipeline</button>

        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                ${e.name.split(" ").map(u=>u[0]).join("").slice(0,2)}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl font-extrabold text-white">${ye(e.name)}</h1>
                  <span class="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 border border-slate-700">${ye(A0(e.status))}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${ye(e.email)} · ${ye(e.phone||"—")} · ${e.experienceYears} yrs experience</p>
                ${e.organization||e.roleTitle||e.source?`<p class="text-[11px] text-slate-500 mt-1">${[e.organization,e.roleTitle,e.source].filter(Boolean).map(u=>ye(u)).join(" · ")}</p>`:""}
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${(e.skills||[]).map(u=>`<span class="px-2 py-0.5 text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800 rounded-md">${ye(u)}</span>`).join("")}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${s?'<button id="cd-csv" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs">Export</button>':""}
              ${s?"":'<button id="cd-reinvite" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs">Resend invite</button>'}
            </div>
          </div>

          ${s?this.scoreHtml(s):`
            <div class="py-10 text-center text-slate-400 space-y-2">
              <p class="text-sm font-semibold">Assessment not submitted yet</p>
              <p class="text-xs">Invite sent ${ye(e.invitedAt||"—")}</p>
            </div>
          `}
          ${this.paperHtml(e)}
        </div>
      </div>`,(i=this.container.querySelector("#cd-back"))==null||i.addEventListener("click",()=>$e.navigate(ka("recruiter"))),(r=this.container.querySelector("#cd-csv"))==null||r.addEventListener("click",()=>this.exportCsv()),(o=this.container.querySelector("#cd-reinvite"))==null||o.addEventListener("click",()=>{this.reinvite()});const a=this.container.querySelector("#recruiter-notes");(l=this.container.querySelector("#decide-select"))==null||l.addEventListener("click",()=>{this.decide("Selected",(a==null?void 0:a.value)||"")}),(d=this.container.querySelector("#decide-review"))==null||d.addEventListener("click",()=>{this.decide("Under Review",(a==null?void 0:a.value)||"")}),(c=this.container.querySelector("#decide-reject"))==null||c.addEventListener("click",()=>{this.decide("Rejected",(a==null?void 0:a.value)||"")})}scoreHtml(e){return`
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${Qa("Score",`${e.totalScore} / ${e.maxScore}`,"text-blue-400")}
        ${Qa("Percentile",`${e.percentage}%`,e.percentage>=70?"text-emerald-400":"text-red-400")}
        ${Qa("Integrity",`${e.aiConfidenceScore}%`,"text-violet-300")}
        ${Qa("Flags",String(e.totalViolations),e.totalViolations>0?"text-amber-400":"text-emerald-400")}
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Section scores</h3>
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900 text-slate-400 text-[10px] font-semibold tracking-wide">
              <tr>
                <th class="p-3 border border-slate-800">Section</th>
                <th class="p-3 border border-slate-800">Score</th>
                <th class="p-3 border border-slate-800">%</th>
              </tr>
            </thead>
            <tbody class="font-mono">
              ${Object.entries(e.sectionScores||{}).map(([s,a])=>`
                <tr class="odd:bg-slate-950 even:bg-slate-900/40">
                  <td class="p-3 border border-slate-800 font-sans font-medium text-slate-200">${ye(s)}</td>
                  <td class="p-3 border border-slate-800">${a.score} / ${a.maxScore}</td>
                  <td class="p-3 border border-slate-800 ${a.percentage>=70?"text-emerald-400":"text-amber-400"}">${a.percentage}%</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Proctoring events</h3>
        ${(e.proctoringLogs||[]).length?(e.proctoringLogs||[]).map(s=>`
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${s.severity==="high"?"bg-red-500/20 text-red-300":"bg-amber-500/20 text-amber-300"}">${ye(s.severity)}</span>
                <span class="font-semibold text-white">${ye(s.type)}</span>
                <span class="text-slate-400 truncate">${ye(s.description)}</span>
              </div>
              <span class="font-mono text-slate-500 text-[10px] shrink-0">${ye(s.timestamp)}</span>
            </div>`).join(""):'<p class="text-xs text-slate-500">No proctoring events recorded.</p>'}
      </div>

      <div class="pt-4 border-t border-slate-800 space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Hiring decision</h3>
        <textarea id="recruiter-notes" placeholder="Add notes for the hiring committee…" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950" rows="3">${ye(e.recruiterNotes||"")}</textarea>
        <div class="flex flex-wrap items-center gap-3">
          <button id="decide-select" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs">Select</button>
          <button id="decide-review" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs">Hold for interview</button>
          <button id="decide-reject" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs">Reject</button>
        </div>
      </div>`}paperHtml(e){const s=e.paper||[];if(!s.length)return"";const a="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return`
      <div class="space-y-3 pt-4 border-t border-slate-800">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Paper this candidate saw</h3>
        ${s.map(n=>`
          <div class="space-y-2">
            <p class="text-[11px] font-bold text-indigo-300">${ye(n.name)}</p>
            ${n.questions.map(i=>`
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <p class="font-semibold text-white">${i.number}. ${ye(i.title)} <span class="text-slate-500 font-mono uppercase">${ye(i.type)}</span></p>
                ${i.options.length?i.options.map((r,o)=>`
                  <p class="${r.correct?"text-emerald-300":"text-slate-400"}">${a[o]||o+1}. ${ye(r.text)}${r.correct?" · correct":""}</p>
                `).join(""):""}
              </div>
            `).join("")}
          </div>
        `).join("")}
      </div>`}exportCsv(){var n;if(!((n=this.row)!=null&&n.result))return;const e=this.row.result,s=["Candidate","Email","Status","Total","Max","Percentage","Pass","Violations","Notes"],a=[this.row.name,this.row.email,this.row.status,e.totalScore,e.maxScore,e.percentage,e.passStatus,e.totalViolations,e.recruiterNotes];En.downloadCsv(`${this.row.name.replace(/\s+/g,"_")}_Scorecard.csv`,s,[a])}async decide(e,s){try{this.row=await j.setDecision(this.candidateId,e,s),this.paint()}catch(a){alert(a instanceof Error?a.message:"Could not save decision.")}}async reinvite(){if(!this.row||!confirm(`Send ${this.row.name} a new exam link and a new passcode? The previous link will stop working.`))return;const e=this.container.querySelector("#cd-reinvite");e&&(e.disabled=!0,e.textContent="Sending…");try{const s=await T.createInvite({name:this.row.name,email:this.row.email,phone:this.row.phone,assessmentId:this.row.assessmentId||"assess-101",expiresInHours:48,candidateId:this.row.id}),a=Date.now()+2e4;let n="PENDING",i="";for(;Date.now()<a;){await new Promise(r=>window.setTimeout(r,1e3));try{const r=await T.inviteDelivery(s.inviteId);if(n=r.deliveryStatus,i=r.message,n==="SENT"||n==="FAILED"||n==="STARTED")break}catch{}}alert(n==="SENT"||n==="STARTED"?`A new exam link and passcode were emailed to ${s.otpDestination}. Earlier links for this assessment no longer work.`:n==="FAILED"?i||"The new invitation was saved, but the email was not delivered. Check the email settings and try again.":`The new invitation is saved for ${s.otpDestination}. The email is still going out — check the inbox, then Spam.`),await this.load()}catch(s){alert(s instanceof Error?s.message:"Invite failed."),e&&(e.disabled=!1,e.textContent="Resend invite")}}}const E0={Applied:"Applied",Screened:"Screened","Assessment Sent":"Invited",Completed:"Submitted","Under Review":"In review",Selected:"Selected",Rejected:"Rejected"},A0=t=>E0[t]||t,ye=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Qa=(t,e,s)=>`
  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
    <span class="text-[10px] font-semibold tracking-wide text-slate-400">${t}</span>
    <div class="text-2xl font-extrabold font-mono ${s} mt-1">${e}</div>
  </div>`,ad=["Quantitative Aptitude","Logical Reasoning","English","Technical"],dn=[{label:"MCQ",type:"mcq"},{label:"Theory",type:"essay"},{label:"Coding",type:"coding"}],T0=t=>{var e;return((e=dn.find(s=>s.type===t))==null?void 0:e.label)||(t==="msq"?"MCQ":t==="sql"?"Coding":t)};class C0{constructor(e,s){h(this,"container");h(this,"jobId");h(this,"jobTitle");h(this,"questions",[]);h(this,"categories",[]);h(this,"jobs",[]);h(this,"jobRoles",[]);h(this,"filterCategory","");h(this,"filterType","");h(this,"filterJobId","");h(this,"loading",!0);h(this,"error","");h(this,"starterDraft",{});h(this,"starterLang","python");this.container=e,this.jobId=(s==null?void 0:s.jobId)||"",this.jobTitle=(s==null?void 0:s.jobTitle)||""}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{const[e,s,a]=await Promise.all([this.jobId?j.jobQuestions(this.jobId,{category:this.filterCategory||void 0,type:this.filterType||void 0}):j.questions({category:this.filterCategory||void 0,type:this.filterType||void 0,scope:"all"}),j.questionCategories(),j.jobs()]);this.questions=this.filterJobId&&!this.jobId?e.items.filter(n=>n.jobId===this.filterJobId):e.items,this.categories=s.items,this.jobs=a.items||[]}catch(e){this.error=e instanceof H?e.message:"Could not load questions.",this.questions=[]}finally{this.loading=!1,this.paint()}}paint(){if(this.loading){this.container.innerHTML='<p class="text-xs text-slate-500 font-mono py-8">Loading question bank…</p>';return}this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">${this.jobId?`${P(this.jobTitle||"Job")} question bank`:"Question Bank"}</h2>
            <p class="text-xs text-slate-400">Create a question, choose its section and category, and assign it to a job (${this.questions.length}).</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${this.jobId?"":'<button id="bulk-q-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-slate-700">Bulk upload</button>'}
            <button id="export-q-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700">Export CSV</button>
            <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">+ Create Question</button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 items-center">
          <button data-section="" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterCategory?"bg-slate-900 text-slate-400 border-slate-700":"bg-blue-600 text-white border-blue-500"}">All sections</button>
          ${ad.map(e=>`
            <button data-section="${P(e)}" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterCategory===e?"bg-blue-600 text-white border-blue-500":"bg-slate-900 text-slate-400 border-slate-700"}">${P(e)}</button>
          `).join("")}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-type="" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterType?"bg-slate-900 text-slate-400 border-slate-700":"bg-indigo-600 text-white border-indigo-500"}">All categories</button>
          ${dn.map(e=>`
            <button data-type="${e.type}" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterType===e.type?"bg-indigo-600 text-white border-indigo-500":"bg-slate-900 text-slate-400 border-slate-700"}">${e.label}</button>
          `).join("")}
        </div>
        ${this.jobs.length?`
          <div class="flex flex-wrap gap-2">
            <button data-job="" class="filter-job px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterJobId?"bg-slate-900 text-slate-400 border-slate-700":"bg-violet-600 text-white border-violet-500"}">All jobs</button>
            ${this.jobs.map(e=>`
              <button data-job="${P(e.id)}" class="filter-job px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterJobId===e.id?"bg-violet-600 text-white border-violet-500":"bg-slate-900 text-slate-400 border-slate-700"}">${P(e.title)}</button>
            `).join("")}
          </div>
        `:""}

        ${this.error?`<p class="text-xs text-red-400 font-semibold">${P(this.error)}</p>`:""}
        <div class="space-y-3">
          ${this.questions.map(e=>`
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${L0(e.type)}">${P(e.type)}</span>
                  <h4 class="text-xs font-bold text-white truncate">${P(e.title)}</h4>
                </div>
                <p class="text-xs text-slate-300 mt-1.5 line-clamp-2">${P(e.content||e.title)}</p>
                <p class="text-[11px] text-slate-400 mt-1">${P(e.sectionCategory||"No section")} • ${P(T0(e.type))} • ${P(this.jobName(e)||"Not assigned")} • ${P(e.difficulty)} • ${e.points} pts</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button data-q-edit="${e.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700">Edit</button>
                <button data-q-del="${e.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
              </div>
            </div>`).join("")||'<p class="text-xs text-slate-500">No questions yet.</p>'}
        </div>
      </div>
      <div id="admin-modal-host"></div>`,this.attachEvents()}attachEvents(){var e,s,a;(e=this.container.querySelector("#create-q-btn"))==null||e.addEventListener("click",()=>this.renderQuestionModal()),(s=this.container.querySelector("#bulk-q-btn"))==null||s.addEventListener("click",()=>this.renderBulkUploadModal()),this.container.querySelectorAll("[data-cat-del]").forEach(n=>{n.addEventListener("click",i=>{i.stopPropagation();const r=i.currentTarget.getAttribute("data-cat-del");r&&this.jobId&&confirm("Delete this category?")&&this.removeCategory(r)})}),this.container.querySelectorAll(".filter-section").forEach(n=>{n.addEventListener("click",i=>{this.filterCategory=i.currentTarget.getAttribute("data-section")||"",this.load()})}),this.container.querySelectorAll(".filter-type").forEach(n=>{n.addEventListener("click",i=>{this.filterType=i.currentTarget.getAttribute("data-type")||"",this.load()})}),this.container.querySelectorAll(".filter-job").forEach(n=>{n.addEventListener("click",i=>{this.filterJobId=i.currentTarget.getAttribute("data-job")||"",this.load()})}),this.container.querySelectorAll("[data-q-edit]").forEach(n=>{n.addEventListener("click",i=>{const r=i.currentTarget.getAttribute("data-q-edit"),o=this.questions.find(l=>l.id===r);o&&this.renderQuestionModal(o)})}),this.container.querySelectorAll("[data-q-del]").forEach(n=>{n.addEventListener("click",i=>{const r=i.currentTarget.getAttribute("data-q-del");r&&confirm("Delete this question?")&&this.remove(r)})}),(a=this.container.querySelector("#export-q-csv-btn"))==null||a.addEventListener("click",()=>{const n=["Title","Type","Category","Difficulty","Points","Tags"],i=this.questions.map(r=>[r.title,r.type,r.sectionCategory||r.category,r.difficulty,r.points,(r.tags||[]).join("; ")]);En.downloadCsv("Question_Bank_Export.csv",n,i)})}jobName(e){var s;return((s=this.jobs.find(a=>a.id===e.jobId))==null?void 0:s.title)||e.jobRole||""}async removeCategory(e){var s;if(this.jobId)try{await j.deleteJobCategory(this.jobId,e),((s=this.categories.find(a=>a.id===e))==null?void 0:s.label)===this.filterCategory&&(this.filterCategory=""),await this.load()}catch(a){alert(a instanceof H?a.message:"Could not delete the category.")}}renderSectionModal(){var a,n,i;const e=this.container.querySelector("#admin-modal-host");if(!e)return;if(!this.jobs.length){alert("Create a job in the Assessment Builder first.");return}e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Add section to a job</h3>
            <button id="close-sec-bank" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="sec-bank-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Job</label>
              <select id="sec-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                ${this.jobs.map(r=>`<option value="${P(r.id)}">${P(r.title)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section name</label>
              <input id="sec-name" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Technical MCQs" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Minutes</label>
                <input id="sec-mins" type="number" value="15" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Cutoff</label>
                <input id="sec-pass" type="number" value="10" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-sec-bank-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Add</button>
            </div>
          </form>
        </div>
      </div>`;const s=()=>{e.innerHTML=""};(a=e.querySelector("#close-sec-bank"))==null||a.addEventListener("click",s),(n=e.querySelector("#close-sec-bank-2"))==null||n.addEventListener("click",s),(i=e.querySelector("#sec-bank-form"))==null||i.addEventListener("submit",r=>{r.preventDefault();const o=e.querySelector("#sec-job").value,l=e.querySelector("#sec-name").value.trim(),d=parseInt(e.querySelector("#sec-mins").value,10)||15,c=parseInt(e.querySelector("#sec-pass").value,10)||10;l&&j.createJobSection(o,{name:l,timeLimitMinutes:d,passingMarks:c}).then(()=>(s(),this.load())).catch(u=>{alert(u instanceof H?u.message:"Could not add the section.")})})}renderCategoryModal(){var a,n,i;const e=this.container.querySelector("#admin-modal-host");if(!e)return;e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Add category</h3>
            <button id="close-cat-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="cat-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Name</label>
              <input id="cat-label" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. SQL" autocomplete="off" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-cat-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Add</button>
            </div>
          </form>
        </div>
      </div>`;const s=()=>{e.innerHTML=""};(a=e.querySelector("#close-cat-modal"))==null||a.addEventListener("click",s),(n=e.querySelector("#close-cat-modal-2"))==null||n.addEventListener("click",s),(i=e.querySelector("#cat-form"))==null||i.addEventListener("submit",r=>{r.preventDefault();const o=e.querySelector("#cat-label").value.trim();if(!o)return;(this.jobId?j.createJobCategory(this.jobId,o):j.createCategory(o)).then(()=>(s(),this.load())).catch(d=>{alert(d instanceof H?d.message:"Could not add the category.")})})}async remove(e){try{await j.deleteQuestion(e),await this.load()}catch(s){alert(s instanceof H?s.message:"Delete failed.")}}renderQuestionModal(e){var c,u,f,p,b,g,y,I,M,R;const s=this.container.querySelector("#admin-modal-host");if(!s)return;if(this.jobId&&!this.categories.length){alert("Add a category for this job first.");return}const a=!!e,n=(c=e==null?void 0:e.options)!=null&&c.length?e.options:[{id:"opt-a",text:""},{id:"opt-b",text:""}],i=(u=e==null?void 0:e.testCases)!=null&&u.length?e.testCases:[{id:"tc-1",input:"",expectedOutput:"",isHidden:!1,weight:1},{id:"tc-2",input:"",expectedOutput:"",isHidden:!0,weight:1}],r=(e==null?void 0:e.sectionCategory)||(e==null?void 0:e.category)||"General";s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white">${a?"Modify Question":"Create Question"}</h3>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="q-title" value="${P((e==null?void 0:e.title)||"")}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Stem / Content</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${P((e==null?void 0:e.content)||"")}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Explanation</label>
              <textarea id="q-explanation" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Why this answer is correct. Candidates do not see this during the exam.">${P((e==null?void 0:e.explanation)||"")}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Section</label>
                <select id="q-cat" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${ad.map(k=>`<option value="${P(k)}" ${k===r?"selected":""}>${P(k)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Category</label>
                <select id="q-type" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${dn.map(k=>`<option value="${k.type}" ${(e==null?void 0:e.type)===k.type||!e&&k.type==="mcq"?"selected":""}>${k.label}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assign to job</label>
                <select id="q-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="">Not assigned</option>
                  ${this.jobs.map(k=>{const te=k.status==="closed",K=(e==null?void 0:e.jobId)===k.id;return te&&!K?"":`<option value="${P(k.id)}" ${K?"selected":""} ${te?"disabled":""}>${P(k.title)}${te?" (closed)":""}</option>`}).join("")}
                </select>
              </div>
            </div>
            <p class="text-[11px] text-slate-500">Assigning a job shows this question in the Assessment Builder under the section and category you chose.</p>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty</label>
                <select id="q-diff" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${["easy","medium","hard"].map(k=>`<option value="${k}" ${(e==null?void 0:e.difficulty)===k?"selected":""}>${k}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Points</label>
                <input type="number" id="q-points" value="${(e==null?void 0:e.points)||10}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Stem format</label>
                <select id="q-stem" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="plain" ${(e==null?void 0:e.stemFormat)!=="markdown"?"selected":""}>plain</option>
                  <option value="markdown" ${(e==null?void 0:e.stemFormat)==="markdown"?"selected":""}>markdown</option>
                </select>
              </div>
            </div>

            <div id="panel-mcq" class="space-y-3 hidden">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-slate-300" id="opts-label">Options</p>
                <button type="button" id="add-opt" class="text-blue-400 font-bold">+ Add</button>
              </div>
              <p id="drag-hint" class="text-[11px] text-slate-500 hidden">List items in the <b>correct order</b>. Candidates will reorder them via drag-and-drop (order is never shown to them).</p>
              <div id="opts-list" class="space-y-2">
                ${n.map((k,te)=>nd(k.id,k.text,((e==null?void 0:e.correctAnswers)||[]).includes(k.id),te,(e==null?void 0:e.type)==="drag_drop")).join("")}
              </div>
            </div>

            <div id="panel-coding" class="space-y-3 hidden">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Constraints</label>
                <textarea id="q-constraints" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${P((e==null?void 0:e.constraints)||"")}</textarea>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">I/O format</label>
                <textarea id="q-io" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${P((e==null?void 0:e.ioFormat)||"")}</textarea>
              </div>
              <div id="starter-block" class="space-y-2">
                <p class="font-semibold text-slate-300">Starter code</p>
                <p class="text-[11px] text-slate-500">Each language opens with its own syntax. The candidate writes between the two blocks, and both blocks stay locked. Edit a language, or clear both boxes to leave it unlocked.</p>
                <div id="starter-tabs" class="flex flex-wrap gap-1.5"></div>
                <label class="block font-semibold text-slate-400">Code before (locked)</label>
                <textarea id="starter-before" rows="8" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" spellcheck="false"></textarea>
                <p class="text-[10px] text-blue-300">Candidate writes here</p>
                <label class="block font-semibold text-slate-400">Code after (locked)</label>
                <textarea id="starter-after" rows="8" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" spellcheck="false"></textarea>
              </div>
              <p class="font-semibold text-slate-300">Test cases (include ≥1 hidden for publish)</p>
              <p class="text-[11px] text-slate-500">One test case can hold Input 1, Input 2, and more. The program receives them as separate lines, in that order. Shift+Enter adds a line inside one input.</p>
              <div id="tc-list" class="space-y-2">
                ${i.map((k,te)=>id(k,te)).join("")}
              </div>
              <button type="button" id="add-tc" class="text-blue-400 font-bold">+ Add test case</button>
            </div>

            <div id="panel-essay" class="space-y-3 hidden">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Min words</label>
                  <input type="number" id="q-minw" value="${(e==null?void 0:e.essayMinWords)||50}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max words</label>
                  <input type="number" id="q-maxw" value="${(e==null?void 0:e.essayMaxWords)||500}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Rubric</label>
                <textarea id="q-rubric" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${P((e==null?void 0:e.rubric)||"")}</textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-q-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"SAVE":"CREATE"}</button>
            </div>
          </form>
        </div>
      </div>`;const o=()=>{s.innerHTML=""};(f=s.querySelector("#close-q-modal-btn"))==null||f.addEventListener("click",o),(p=s.querySelector("#close-q-modal-btn-2"))==null||p.addEventListener("click",o);const l=()=>{var Ye,De,vs,na,Ot;const k=s.querySelector("#q-type").value,te=k==="mcq"||k==="msq"||k==="drag_drop";(Ye=s.querySelector("#panel-mcq"))==null||Ye.classList.toggle("hidden",!te),(De=s.querySelector("#panel-coding"))==null||De.classList.toggle("hidden",!(k==="coding"||k==="sql")),(vs=s.querySelector("#starter-block"))==null||vs.classList.toggle("hidden",k!=="coding"),(na=s.querySelector("#panel-essay"))==null||na.classList.toggle("hidden",k!=="essay"),(Ot=s.querySelector("#drag-hint"))==null||Ot.classList.toggle("hidden",k!=="drag_drop");const K=s.querySelector("#opts-label");K&&(K.textContent=k==="drag_drop"?"Items (correct order top → bottom)":"Options"),s.querySelectorAll(".opt-correct").forEach(ti=>{ti.style.display=k==="drag_drop"?"none":""})};(b=s.querySelector("#q-type"))==null||b.addEventListener("change",l),l(),this.mountStarterEditor(s,e),(g=s.querySelector("#q-form"))==null||g.addEventListener("keydown",k=>{const te=k,K=te.target;if(K instanceof HTMLTextAreaElement&&!(!K.classList.contains("tc-in")&&!K.classList.contains("tc-out"))&&te.key==="Enter"&&te.shiftKey){te.preventDefault();const Ye=K.selectionStart,De=K.selectionEnd;K.value=`${K.value.slice(0,Ye)}
${K.value.slice(De)}`,K.selectionStart=K.selectionEnd=Ye+1}});const d=s.querySelector("#q-job");d==null||d.addEventListener("change",()=>{this.fillSections(s,e)}),this.fillSections(s,e),(y=s.querySelector("#add-opt"))==null||y.addEventListener("click",()=>{const k=s.querySelector("#opts-list");if(!k)return;const te=`opt-${Date.now()}`;k.insertAdjacentHTML("beforeend",nd(te,"",!1,k.children.length))}),(I=s.querySelector("#add-tc"))==null||I.addEventListener("click",()=>{const k=s.querySelector("#tc-list");k&&k.insertAdjacentHTML("beforeend",id({id:`tc-${Date.now()}`,input:"",inputs:[""],expectedOutput:"",isHidden:!0,weight:1},k.children.length))}),(M=s.querySelector("#tc-list"))==null||M.addEventListener("click",k=>{var na;const te=k.target,K=te.closest(".add-tc-input");if(K){const Ot=(na=K.closest("[data-tc-row]"))==null?void 0:na.querySelector(".tc-inputs");if(!Ot)return;Ot.insertAdjacentHTML("beforeend",Au("",Ot.querySelectorAll(".tc-input-slot").length));return}const Ye=te.closest(".remove-tc-input"),De=Ye==null?void 0:Ye.closest(".tc-input-slot"),vs=De==null?void 0:De.parentElement;!De||!vs||vs.querySelectorAll(".tc-input-slot").length<2||(De.remove(),vs.querySelectorAll(".tc-input-label").forEach((Ot,ti)=>{Ot.textContent=`Input ${ti+1}`}))}),(R=s.querySelector("#q-form"))==null||R.addEventListener("submit",k=>{k.preventDefault(),this.saveQuestion(e,s,o)})}async fillSections(e,s){var r;const a=e.querySelector("#q-section"),n=((r=e.querySelector("#q-job"))==null?void 0:r.value)||"";if(!a)return;if(!n){a.innerHTML='<option value="">Choose a job first</option>';return}const i=this.jobs.find(o=>o.id===n);if(i)try{const o=await j.assessment(i.assessmentId),l=o.sections.find(d=>(d.questions||[]).some(c=>c.id===(s==null?void 0:s.id)));a.innerHTML=`<option value="">No section yet</option>${o.sections.map(d=>`<option value="${P(d.id)}" ${(l==null?void 0:l.id)===d.id?"selected":""}>${P(d.name)}</option>`).join("")}`}catch{a.innerHTML='<option value="">Could not load sections</option>'}}flushStarterFields(e){const s=e.querySelector("#starter-before"),a=e.querySelector("#starter-after");!s||!a||(this.starterDraft[this.starterLang]={before:s.value,after:a.value})}mountStarterEditor(e,s){this.starterDraft={},un.forEach(l=>{var u;const d=(u=s==null?void 0:s.sampleCode)==null?void 0:u[l.id],c=Ii(l.id);d&&typeof d=="object"&&((d.before||"").trim()||(d.after||"").trim())?this.starterDraft[l.id]={before:d.before||"",after:d.after||""}:typeof d=="string"&&d.trim()?this.starterDraft[l.id]={before:d,after:""}:this.starterDraft[l.id]=c}),this.starterLang=s!=null&&s.language&&this.starterDraft[s.language]?s.language:"python";const a=e.querySelector("#starter-tabs"),n=e.querySelector("#starter-before"),i=e.querySelector("#starter-after"),r=()=>{a&&(a.innerHTML=un.map(l=>`
        <button type="button" data-starter-lang="${l.id}" class="px-2 py-1 rounded-lg text-[10px] font-bold border ${this.starterLang===l.id?"bg-blue-600 text-white border-blue-500":"bg-slate-900 text-slate-400 border-slate-700"}">${P(l.label.split(" ")[0])}</button>
      `).join(""),a.querySelectorAll("[data-starter-lang]").forEach(l=>{l.addEventListener("click",()=>{this.flushStarterFields(e),this.starterLang=l.getAttribute("data-starter-lang")||"python";const d=this.starterDraft[this.starterLang]||Ii(this.starterLang);n&&(n.value=d.before),i&&(i.value=d.after),r()})}))},o=this.starterDraft[this.starterLang]||{before:"",after:""};n&&(n.value=o.before),i&&(i.value=o.after),r()}async saveQuestion(e,s,a){var d,c,u,f,p,b,g;const n=s.querySelector("#q-type").value,i=s.querySelector("#q-cat").value,r=((d=s.querySelector("#q-job"))==null?void 0:d.value)||this.jobId||"",o=((c=s.querySelector("#q-section"))==null?void 0:c.value)||"",l={type:n,title:s.querySelector("#q-title").value.trim(),content:s.querySelector("#q-content").value.trim(),difficulty:s.querySelector("#q-diff").value,points:parseInt(s.querySelector("#q-points").value,10)||10,sectionCategory:i,category:((u=dn.find(y=>y.type===n))==null?void 0:u.label)||"MCQ",jobId:r,sectionId:o,jobRole:((f=this.jobs.find(y=>y.id===r))==null?void 0:f.title)||null,stemFormat:s.querySelector("#q-stem").value,explanation:((p=s.querySelector("#q-explanation"))==null?void 0:p.value)||"",tags:(e==null?void 0:e.tags)||[],status:"published"};if(n==="mcq"||n==="msq"||n==="drag_drop"){l.selectionMode=n==="msq"?"multi":"single";const y=[],I=[];s.querySelectorAll("[data-opt-row]").forEach(M=>{var K;const R=M.getAttribute("data-opt-row")||"",k=M.querySelector(".opt-text").value.trim(),te=(K=M.querySelector(".opt-correct"))==null?void 0:K.checked;R&&k&&(y.push({id:R,text:k}),(n==="drag_drop"||te)&&I.push(R))}),l.options=y,l.correctAnswers=I}if(n==="coding"||n==="sql"){if(l.constraints=((b=s.querySelector("#q-constraints"))==null?void 0:b.value)||"",l.ioFormat=((g=s.querySelector("#q-io"))==null?void 0:g.value)||"",n==="coding"){this.flushStarterFields(s);const I={};Object.entries(this.starterDraft).forEach(([M,R])=>{((R.before||"").trim()||(R.after||"").trim())&&(I[M]=R)}),l.sampleCode=I,l.language=this.starterLang}const y=[];s.querySelectorAll("[data-tc-row]").forEach(I=>{const M=I.getAttribute("data-tc-row")||"",R=Array.from(I.querySelectorAll(".tc-in")).map(k=>k.value);y.push({id:M,inputs:R.length?R:[""],input:(R.length?R:[""]).join(`
`),expectedOutput:I.querySelector(".tc-out").value,isHidden:I.querySelector(".tc-hidden").checked,weight:parseInt(I.querySelector(".tc-weight").value,10)||1})}),l.testCases=y}n==="essay"&&(l.essayMinWords=parseInt(s.querySelector("#q-minw").value,10)||50,l.essayMaxWords=parseInt(s.querySelector("#q-maxw").value,10)||500,l.rubric=s.querySelector("#q-rubric").value);try{e?await j.updateQuestion(e.id,l):await j.createQuestion(l),a(),await this.load()}catch(y){alert(y instanceof H?y.message:"Save failed.")}}renderBulkUploadModal(){const e=this.container.querySelector("#admin-modal-host");if(!e)return;let s=null,a=!1,n="";const i=()=>{var f,p,b;e.innerHTML=`
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 class="text-lg font-extrabold text-white">Bulk upload questions</h3>
                <p class="text-xs text-slate-400 mt-0.5">Upload .xlsx / .xls / .csv — rows are parsed and stored in the question bank</p>
              </div>
              <button id="bulk-q-close" class="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            ${s?`
              <div class="flex flex-wrap gap-2 text-[11px] font-bold">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Created ${s.created}</span>
                <span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${s.failed}</span>
                <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${s.totalRows}</span>
              </div>
              ${s.errors.length?`
                <div class="max-h-40 overflow-y-auto rounded-xl border border-slate-800 text-[11px]">
                  ${s.errors.map(g=>`
                    <div class="px-3 py-2 border-b border-slate-800/80">
                      <span class="text-slate-500 font-mono">Row ${g.rowNumber}</span>
                      <span class="text-white ml-2">${P(g.title||"(untitled)")}</span>
                      <p class="text-red-400 mt-0.5">${P((g.errors||[]).join("; "))}</p>
                    </div>`).join("")}
                </div>
              `:'<p class="text-xs text-emerald-300">All rows imported successfully.</p>'}
            `:`
              <div>
                <label class="block font-semibold text-slate-300 mb-1 text-xs">Assign imported questions to a job</label>
                <select id="bulk-q-role" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
                  <option value="">— Not assigned —</option>
                  ${this.jobs.filter(g=>g.status!=="closed").map(g=>`<option value="${P(g.id)}">${P(g.title)}</option>`).join("")}
                </select>
                <p class="text-[11px] text-slate-500 mt-1">Closed jobs are not listed. A Job column in the file overrides this for that row.</p>
              </div>
              <label id="bulk-q-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
                <span class="text-3xl">📤</span>
                <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
                <span class="text-[11px] text-slate-500">Columns: Question, Section, Category, Content, Difficulty, Points, Options, CorrectAnswer, Job</span>
                <input id="bulk-q-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" ${a?"disabled":""} />
              </label>
              ${a?'<p class="text-xs text-blue-300 font-mono">Importing…</p>':""}
            `}

            ${n?`<p class="text-xs text-red-400 font-semibold">${P(n)}</p>`:""}

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button type="button" id="bulk-q-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">Download sample template</button>
              <button type="button" id="bulk-q-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>`;const r=()=>{e.innerHTML="",s&&s.created>0&&this.load()};(f=e.querySelector("#bulk-q-close"))==null||f.addEventListener("click",r),(p=e.querySelector("#bulk-q-close-2"))==null||p.addEventListener("click",r),(b=e.querySelector("#bulk-q-sample"))==null||b.addEventListener("click",()=>j.downloadQuestionSample());const o=e.querySelector("#bulk-q-file"),l=e.querySelector("#bulk-q-drop"),d=e.querySelector("#bulk-q-role");let c=(d==null?void 0:d.value)||"";d==null||d.addEventListener("change",()=>{c=d.value});const u=async g=>{const y=c||(d==null?void 0:d.value)||"";if(!y){n="Select a job before uploading. Questions are assigned to that job.",i();return}a=!0,n="",i();try{s=await j.bulkImportQuestions(g,y)}catch(I){n=I instanceof H?I.message:"Upload failed."}finally{a=!1,i()}};o==null||o.addEventListener("change",()=>{var y;const g=(y=o.files)==null?void 0:y[0];g&&u(g)}),l==null||l.addEventListener("dragover",g=>{g.preventDefault()}),l==null||l.addEventListener("drop",g=>{var I,M;g.preventDefault();const y=(M=(I=g.dataTransfer)==null?void 0:I.files)==null?void 0:M[0];y&&u(y)})};i()}}const P=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),L0=t=>t==="coding"?"bg-blue-500/20 text-blue-300":t==="sql"?"bg-purple-500/20 text-purple-300":t==="essay"?"bg-amber-500/20 text-amber-300":t==="msq"?"bg-cyan-500/20 text-cyan-300":"bg-emerald-500/20 text-emerald-300",nd=(t,e,s,a,n=!1)=>`
  <div data-opt-row="${P(t)}" class="flex items-center gap-2">
    <input type="checkbox" class="opt-correct" ${s?"checked":""} title="Correct" ${n?'style="display:none"':""} />
    <span class="text-slate-600 font-mono text-[10px] w-4">${a+1}</span>
    <input class="opt-text glass-input flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" value="${P(e)}" placeholder="${n?"Item text":"Option text"}" />
    <button type="button" class="text-slate-500 hover:text-red-400 font-bold px-1" onclick="this.closest('[data-opt-row]')?.remove()" title="Remove">×</button>
  </div>`,Au=(t,e)=>`
  <div class="tc-input-slot flex items-start gap-2">
    <span class="tc-input-label w-16 shrink-0 pt-2 text-[10px] font-bold text-slate-400">Input ${e+1}</span>
    <textarea class="tc-in flex-1 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Value for this input">${P(t)}</textarea>
    <button type="button" class="remove-tc-input text-slate-500 hover:text-red-400 font-bold px-1 pt-1" title="Remove this input">×</button>
  </div>`,id=(t,e)=>`
  <div data-tc-row="${P(t.id)}" class="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-bold text-slate-300">Test case ${e+1}</span>
      <button type="button" class="text-slate-500 hover:text-red-400 font-bold text-xs" onclick="this.closest('[data-tc-row]')?.remove()">Remove case</button>
    </div>
    <div class="tc-inputs space-y-2">
      ${hd(t).map((s,a)=>Au(s,a)).join("")}
    </div>
    <button type="button" class="add-tc-input text-blue-400 text-[11px] font-bold">+ Add input</button>
    <label class="block text-[10px] font-bold text-slate-400">Expected output</label>
    <textarea class="tc-out w-full glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Expected">${P(t.expectedOutput)}</textarea>
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-1 text-slate-400 text-xs"><input type="checkbox" class="tc-hidden" ${t.isHidden?"checked":""} /> Hidden</label>
      <input type="number" class="tc-weight w-20 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white" value="${t.weight}" title="Weight" />
    </div>
  </div>`,_0={all:0,applied:0,screened:0,assessmentSent:0,completed:0,underReview:0,selected:0,rejected:0},Ya={ALL:"All",Applied:"Applied",Screened:"Screened","Assessment Sent":"Invited",Completed:"Submitted","Under Review":"In review",Selected:"Selected",Rejected:"Rejected"},V=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class I0{constructor(e){h(this,"container");h(this,"currentViewMode","table");h(this,"activeStageTab","ALL");h(this,"rows",[]);h(this,"counts",{..._0});h(this,"loading",!1);h(this,"error","");this.container=e}render(){const e=Os(),s=e.kind==="staff"?e.section:"";if(s.startsWith("candidates/")){const n=s.slice(11).split("/")[0];this.container.innerHTML='<div id="recruiter-section"></div>',new $0(this.container.querySelector("#recruiter-section"),n).render();return}const a=Sa("recruiter");if(a==="assessment-builder"||a==="question-bank"){this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="recruiter-section"></div></div>';const n=this.container.querySelector("#recruiter-section");a==="assessment-builder"?new v0(n).render():new C0(n).render();return}this.loadPipeline(),this.paintShell()}stageSlug(){var e;return this.activeStageTab==="ALL"?null:((e=za.find(s=>s.status===this.activeStageTab))==null?void 0:e.slug)||null}async loadPipeline(){this.loading=!0,this.error="",this.paintShell();try{const e=this.stageSlug(),s=e?await j.pipelineStage(e):await j.pipeline();this.rows=s.items,this.counts=s.counts||this.counts}catch(e){this.error=e instanceof H?e.message:"Could not load pipeline.",this.rows=[]}finally{this.loading=!1,this.paintShell()}}countFor(e){var a;if(e==="ALL")return this.counts.all;const s=(a=za.find(n=>n.status===e))==null?void 0:a.countKey;return s?this.counts[s]:0}openCandidate(e){$e.navigate(`/recruiter/candidates/${e}`)}paintShell(){const e=["ALL",...za.map(s=>s.status)];this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                💼 Talent Operations
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline</h1>
            <p class="text-xs text-slate-400">Track candidates from invite through automated code evaluation and final decision.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-table-btn" title="Table layout" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="table"?"bg-indigo-600 text-white shadow":"text-slate-400 hover:text-white"}">Table</button>
              <button id="view-kanban-btn" title="Board layout by stage" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="kanban"?"bg-indigo-600 text-white shadow":"text-slate-400 hover:text-white"}">Board</button>
            </div>
            ${this.currentViewMode==="table"?`
              <button id="export-all-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs">Export</button>
            `:""}
            <button id="view-sent-emails-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Sent invites</button>
            <button id="bulk-invite-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Bulk invite</button>
            <button id="invite-cand-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30">Invite candidate</button>
          </div>
        </div>

        <div>
          <p class="text-[11px] font-semibold text-slate-500 mb-2 px-0.5">Filter by hiring stage</p>
          <div class="glass-panel p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          ${e.map(s=>{const a=this.activeStageTab===s;return`
              <button data-stage-tab="${s}" class="stage-tab-btn px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border ${a?"bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-sm":"bg-transparent text-slate-400 hover:text-white border-transparent hover:bg-slate-900"}">
                <span>${Ya[s]}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded-md ${a?"bg-white/20":"bg-slate-900 text-slate-500"}">${this.countFor(s)}</span>
              </button>`}).join("")}
          </div>
        </div>

        ${this.error?`<p class="text-xs text-red-400 font-semibold">${V(this.error)}</p>`:""}
        ${this.loading?'<p class="text-xs text-slate-500 font-mono">Loading pipeline…</p>':""}

        ${this.currentViewMode==="table"?this.excelTableHtml():this.kanbanHtml()}

        <div id="invite-modal-host"></div>
      </div>`,this.attachEvents()}excelTableHtml(){return`
      <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <h3 class="text-xs font-bold text-white tracking-wide">${Ya[this.activeStageTab]} · Candidates</h3>
          <span class="text-[11px] font-mono text-slate-400">${this.rows.length}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-xs font-mono border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                ${["#","Name","Email","Phone","Exp","Skills","Stage","Score","%","Violations","Actions"].map(e=>`<th class="px-3 py-2.5 border border-slate-700/80 whitespace-nowrap font-bold">${e}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${this.rows.length===0&&!this.loading?'<tr><td colspan="11" class="px-4 py-10 text-center text-slate-500 border border-slate-800">No candidates in this stage.</td></tr>':this.rows.map((e,s)=>`
                  <tr class="${s%2===0?"bg-slate-950":"bg-slate-900/50"} hover:bg-slate-800/40">
                    <td class="px-3 py-2 border border-slate-800 text-slate-500">${s+1}</td>
                    <td class="px-3 py-2 border border-slate-800">
                      <button data-open-cand="${e.id}" class="cand-name-click font-sans font-bold text-blue-400 hover:text-blue-300 hover:underline text-left">${V(e.name)}</button>
                    </td>
                    <td class="px-3 py-2 border border-slate-800 text-slate-300">${V(e.email)}</td>
                    <td class="px-3 py-2 border border-slate-800 text-slate-400 whitespace-nowrap">${V(e.phone||"—")}</td>
                    <td class="px-3 py-2 border border-slate-800 text-center">${e.experienceYears}</td>
                    <td class="px-3 py-2 border border-slate-800 font-sans text-[10px] text-slate-400 max-w-[160px] truncate" title="${V((e.skills||[]).join(", "))}">${V((e.skills||[]).slice(0,3).join(", ")||"—")}</td>
                    <td class="px-3 py-2 border border-slate-800">
                      <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap">${V(Ya[e.status]||e.status)}</span>
                    </td>
                    <td class="px-3 py-2 border border-slate-800 text-blue-400 font-bold">${e.totalScore!=null?`${e.totalScore}/${e.maxScore}`:"—"}</td>
                    <td class="px-3 py-2 border border-slate-800 font-bold ${e.percentage!=null&&e.percentage>=70?"text-emerald-400":e.percentage!=null?"text-red-400":"text-slate-500"}">${e.percentage!=null?`${e.percentage}%`:"—"}</td>
                    <td class="px-3 py-2 border border-slate-800 ${e.violations>0?"text-amber-400 font-bold":"text-slate-400"}">${e.violations}</td>
                    <td class="px-3 py-2 border border-slate-800 whitespace-nowrap">
                      <button data-open-cand="${e.id}" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700">Open</button>
                      ${e.percentage!=null?`<button data-export-cand="${e.id}" class="ml-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">Export</button>`:""}
                    </td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`}kanbanHtml(){return`
      <div class="flex gap-5 overflow-x-auto pb-6 pt-2">
        ${(this.activeStageTab==="ALL"?za.map(s=>s.status):[this.activeStageTab]).map(s=>{const a=this.rows.filter(n=>n.status===s);return`
            <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 class="text-xs font-bold text-white tracking-wide">${Ya[s]||s}</h3>
                <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 rounded-full">${a.length}</span>
              </div>
              <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px]">
                ${a.map(n=>`
                  <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 cursor-pointer space-y-3" data-open-cand="${n.id}">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-white hover:text-blue-400">${V(n.name)}</h4>
                        <p class="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">${V(n.email)}</p>
                      </div>
                      <span class="text-[10px] font-mono text-slate-500">${n.experienceYears}y</span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      ${(n.skills||[]).slice(0,3).map(i=>`<span class="px-2 py-0.5 text-[10px] bg-slate-950 text-slate-300 border border-slate-800 rounded-lg">${V(i)}</span>`).join("")}
                    </div>
                    ${n.percentage!=null?`<p class="text-xs font-extrabold font-mono ${n.percentage>=70?"text-emerald-400":"text-red-400"}">Score: ${n.percentage}%</p>`:'<p class="text-[11px] text-slate-500">Awaiting assessment</p>'}
                  </div>`).join("")||`
                  <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500">No candidates in this stage.</div>`}
              </div>
            </div>`}).join("")}
      </div>`}attachEvents(){var e,s,a,n,i,r;this.container.querySelectorAll(".stage-tab-btn").forEach(o=>{o.addEventListener("click",l=>{this.activeStageTab=l.currentTarget.getAttribute("data-stage-tab"),this.loadPipeline()})}),(e=this.container.querySelector("#view-table-btn"))==null||e.addEventListener("click",()=>{this.currentViewMode="table",this.paintShell()}),(s=this.container.querySelector("#view-kanban-btn"))==null||s.addEventListener("click",()=>{this.currentViewMode="kanban",this.paintShell()}),this.container.querySelectorAll("[data-open-cand]").forEach(o=>{o.addEventListener("click",l=>{l.stopPropagation();const d=l.currentTarget.getAttribute("data-open-cand");d&&this.openCandidate(d)})}),this.container.querySelectorAll("[data-export-cand]").forEach(o=>{o.addEventListener("click",l=>{l.stopPropagation();const d=l.currentTarget.getAttribute("data-export-cand");d&&this.exportOne(d)})}),(a=this.container.querySelector("#export-all-csv-btn"))==null||a.addEventListener("click",()=>this.exportAll()),(n=this.container.querySelector("#view-sent-emails-btn"))==null||n.addEventListener("click",()=>this.renderSentEmailsModal()),(i=this.container.querySelector("#bulk-invite-btn"))==null||i.addEventListener("click",()=>this.renderBulkInvite()),(r=this.container.querySelector("#invite-cand-btn"))==null||r.addEventListener("click",()=>this.renderInviteModal())}renderBulkInvite(){const e=this.container.querySelector("#invite-modal-host");e&&this.openBulkInvite(e)}async openBulkInvite(e){var a,n;let s=[];try{s=(await j.jobs()).items.filter(r=>r.status==="open")}catch(i){alert(i instanceof H?i.message:"Could not load jobs.");return}if(!s.length){alert("No open job. Set a job to open and save it before sending invitations.");return}if(s.length===1){new sd(e,s[0].assessmentId,s[0].title).open();return}e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Bulk invite</h3>
            <button id="bulk-job-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <label class="block font-semibold text-slate-300 mb-1">Job</label>
            <select id="bulk-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
              ${s.map(i=>`<option value="${V(i.id)}">${V(i.title)} · ${V(i.status)}</option>`).join("")}
            </select>
            <button id="bulk-job-next" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Continue</button>
          </div>
        </div>
      </div>`,(a=e.querySelector("#bulk-job-close"))==null||a.addEventListener("click",()=>{e.innerHTML=""}),(n=e.querySelector("#bulk-job-next"))==null||n.addEventListener("click",()=>{const i=e.querySelector("#bulk-job").value,r=s.find(o=>o.id===i);r&&new sd(e,r.assessmentId,r.title).open()})}exportOne(e){const s=this.rows.find(n=>n.id===e);if(!s)return;const a=["Name","Email","Status","Score","Percentage","Violations"];En.downloadCsv(`${s.name.replace(/\s+/g,"_")}_Scores.csv`,a,[[s.name,s.email,s.status,s.totalScore??"N/A",s.percentage!=null?`${s.percentage}%`:"N/A",s.violations]])}exportAll(){const e=["Name","Email","Phone","Status","Score","Max","Percentage","Violations"],s=this.rows.map(a=>[a.name,a.email,a.phone,a.status,a.totalScore??"N/A",a.maxScore??"N/A",a.percentage!=null?`${a.percentage}%`:"N/A",a.violations]);En.downloadCsv("Candidate_Section_Scores_Report.csv",e,s)}renderSentEmailsModal(){var a;const e=nr.getSentEmails(),s=this.container.querySelector("#invite-modal-host");s&&(s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
            <div>
              <h3 class="text-base font-extrabold text-white">Sent invites</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${e.length} in this session</p>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="overflow-auto flex-1">
            ${e.length?`
              <table class="w-full text-xs">
                <thead class="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="text-left font-semibold px-4 py-3">Sent</th>
                    <th class="text-left font-semibold px-4 py-3">Recipient</th>
                    <th class="text-left font-semibold px-4 py-3">Assessment</th>
                    <th class="text-left font-semibold px-4 py-3">Duration</th>
                    <th class="text-left font-semibold px-4 py-3">Link / Deadline</th>
                    <th class="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.map(n=>`
                    <tr class="border-b border-slate-800/80 hover:bg-slate-900/50 align-top">
                      <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${V(n.sentAt)}</td>
                      <td class="px-4 py-3">
                        <div class="font-semibold text-white">${V(n.recipientName)}</div>
                        <div class="text-slate-400">${V(n.recipientEmail)}</div>
                      </td>
                      <td class="px-4 py-3 text-blue-300 font-medium">${V(n.assessmentTitle||n.subject)}</td>
                      <td class="px-4 py-3 text-slate-300 font-mono">${n.durationMinutes!=null?`${n.durationMinutes}m`:"—"}</td>
                      <td class="px-4 py-3 max-w-xs">
                        ${n.assessmentLink?`<a href="${V(n.assessmentLink)}" target="_blank" class="text-blue-400 hover:underline break-all line-clamp-2">${V(n.assessmentLink)}</a>`:'<span class="text-slate-600">—</span>'}
                        ${n.expiresAt?`<div class="text-[10px] text-amber-400/90 mt-1">Expires: ${V(n.expiresAt)}</div>`:""}
                        ${n.otpCode?`<div class="text-[10px] text-amber-300 mt-0.5">DEV OTP: ${V(n.otpCode)}</div>`:""}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap"><span class="text-emerald-400">✓ ${V(n.status)}</span></td>
                    </tr>`).join("")}
                </tbody>
              </table>
            `:'<p class="text-xs text-slate-500 p-8">No emails logged in this browser session. Dispatch an invitation to see it here.</p>'}
          </div>
        </div>
      </div>`,(a=s.querySelector("#close-email-log-btn"))==null||a.addEventListener("click",()=>{s.innerHTML=""}))}renderInviteModal(){const e=this.container.querySelector("#invite-modal-host");e&&this.openInviteModal(e)}async openInviteModal(e){var i;let s=[];try{s=(await j.jobs()).items.filter(o=>o.status==="open")}catch{s=[]}e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Invite candidate</h3>
            <button id="close-invite-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Name</label>
              <input id="inv-name" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="Full name" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Email</label>
              <input id="inv-email" type="email" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="candidate@company.com" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Job</label>
              ${s.length?`
                <select id="inv-assess" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${s.map(r=>`<option value="${V(r.assessmentId)}">${V(r.title)} · ${V(r.status)}</option>`).join("")}
                </select>
              `:'<p class="text-amber-400 text-[11px]">No open job. Set a job to open and save it before sending an invitation.</p>'}
            </div>
            <button id="send-inv-btn" ${s.length?"":"disabled"} class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold">Send invitation</button>
            <div id="dispatch-output-box" class="hidden p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <p id="dispatch-msg-text"></p>
            </div>
          </div>
        </div>
      </div>`;const a=r=>{r==null||r.addEventListener("focus",()=>{r.value.trim()&&r.select()})};a(e.querySelector("#inv-name")),a(e.querySelector("#inv-email")),(i=e.querySelector("#close-invite-btn"))==null||i.addEventListener("click",()=>{e.innerHTML="",this.loadPipeline()});const n=e.querySelector("#send-inv-btn");n==null||n.addEventListener("click",async()=>{var c;const r=e.querySelector("#inv-name").value.trim(),o=e.querySelector("#inv-email").value.trim(),l=e.querySelector("#inv-assess"),d=((c=l==null?void 0:l.value)==null?void 0:c.trim())||"";if(!r)return alert("Please enter the candidate name.");if(!o)return alert("Please enter the candidate email address.");if(!d)return alert("Please select a job.");n.disabled=!0,n.textContent="Sending invitation…";try{const u=await T.createInvite({name:r,email:o,assessmentId:d,expiresInHours:48});nr.recordInvite(r,o,u.link,u.devOtp,{assessmentTitle:u.assessmentTitle||void 0,durationMinutes:u.durationMinutes??void 0,expiresAt:u.expiresAt});const f=e.querySelector("#dispatch-output-box"),p=e.querySelector("#dispatch-msg-text");f==null||f.classList.remove("hidden");const b=u.devOtp?` <span class="text-amber-300">(DEV OTP: <strong>${V(u.devOtp)}</strong>)</span>`:"";p&&(p.innerHTML=`Sending the invitation to <strong>${V(u.otpDestination)}</strong>…${b}`),n.textContent="✓ Invitation created";const g=Date.now()+2e4;for(;Date.now()<g&&p;){await new Promise(I=>window.setTimeout(I,1e3));let y;try{y=await T.inviteDelivery(u.inviteId)}catch{continue}if(y.deliveryStatus==="SENT"){p.innerHTML=`Invitation emailed to <strong>${V(u.otpDestination)}</strong>, the address entered above. Check that inbox, then Spam and Promotions.${b}`,n.textContent="✓ Invitation emailed";break}if(y.deliveryStatus==="FAILED"){p.innerHTML=`The invitation was saved, but the email was not delivered. ${V(y.message||"Check System Admin email settings.")}`,n.textContent="Email failed",n.disabled=!1;break}}p&&n.textContent==="✓ Invitation created"&&(p.innerHTML=`The invitation is saved for <strong>${V(u.otpDestination)}</strong>. The email is still going out — check the inbox, then Spam and Promotions.${b}`)}catch(u){alert(u instanceof H?u.message:"Invite failed."),n.disabled=!1,n.textContent="Send invitation"}})}}class M0{constructor(e,s){this.container=e,this.portal=s}render(){var i;const e=x.getState(),s=e.currentUser,a=jt[this.portal],n=e.allowedPortals.map(r=>jt[r]);this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mx-auto flex items-center justify-center text-2xl">⛔</div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Access denied</h2>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <b class="text-slate-200">${(s==null?void 0:s.name)??""}</b> (${(s==null?void 0:s.role)??""}).
              That role cannot open the <b class="text-slate-200">${a.title}</b>.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            ${n.map(r=>`
              <button data-go="${r.path}" class="go-btn w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider transition-all">
                ${r.icon} Go to ${r.title}
              </button>
            `).join("")}
            <button id="denied-logout" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              🚪 Sign out to use a different account
            </button>
          </div>
        </div>
      </div>
    `,this.container.querySelectorAll(".go-btn").forEach(r=>r.addEventListener("click",o=>$e.navigate(o.currentTarget.getAttribute("data-go")||"/"))),(i=this.container.querySelector("#denied-logout"))==null||i.addEventListener("click",()=>{x.logoutStaff().catch(()=>{})})}}const P0=t=>t instanceof H?t.message:"Something went wrong. Please try again.",Ai=8;function j0(t,e){var d,c,u,f;const s=jt[e.portal],a=x.getState().currentUser;t.innerHTML=`
    <div class="glass-panel w-full max-w-md mx-auto rounded-3xl border border-slate-800 p-8 space-y-5 shadow-2xl">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
        <span class="text-2xl">🔑</span>
        <div class="flex-1">
          <h2 class="text-lg font-extrabold text-white">${e.forced?"Set your new password":"Change password"}</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">${e.forced?`Your administrator issued a temporary password for the ${s.loginTitle}. Choose your own to continue.`:"You will be signed out of your other devices."}</p>
        </div>
        ${e.forced?"":'<button id="pw-cancel-x" class="text-slate-400 hover:text-white font-bold">✕</button>'}
      </div>

      <p id="pw-error" class="text-xs font-semibold text-red-400 hidden"></p>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-current">${e.forced?"Temporary password":"Current password"}</label>
          <input id="pw-current" type="password" autocomplete="current-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-new">New password</label>
          <input id="pw-new" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="At least ${Ai} characters" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-confirm">Confirm new password</label>
          <input id="pw-confirm" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <button id="pw-submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60">
          UPDATE PASSWORD ➔
        </button>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>Signed in as <b class="text-slate-300">${a?a.email.replace(/[<>&"]/g,""):""}</b></span>
          ${e.forced?'<button id="pw-logout" type="button" class="font-semibold text-slate-400 hover:text-white">Sign out</button>':'<button id="pw-cancel" type="button" class="font-semibold text-slate-400 hover:text-white">Cancel</button>'}
        </div>
      </div>
    </div>
  `;const n=p=>t.querySelector(p),i=n("#pw-error"),r=p=>{i&&(i.textContent=p,i.classList.toggle("hidden",!p))},o=n("#pw-submit"),l=()=>{var y,I,M;const p=((y=n("#pw-current"))==null?void 0:y.value)||"",b=((I=n("#pw-new"))==null?void 0:I.value)||"",g=((M=n("#pw-confirm"))==null?void 0:M.value)||"";if(!p||!b)return r("Fill in all the fields.");if(b.length<Ai)return r(`New password must be at least ${Ai} characters.`);if(b!==g)return r("The new passwords do not match.");if(b===p)return r("Choose a password different from the current one.");r(""),o&&(o.disabled=!0),T.changePassword(e.portal,p,b).then(R=>{var k;x.loginStaff(R.user),(k=e.onCancel)==null||k.call(e)}).catch(R=>{r(P0(R)),o&&o.isConnected&&(o.disabled=!1)})};o==null||o.addEventListener("click",l),t.querySelectorAll("input").forEach(p=>p.addEventListener("keydown",b=>{b.key==="Enter"&&l()})),(d=n("#pw-logout"))==null||d.addEventListener("click",()=>{x.logoutStaff().catch(()=>{})}),(c=n("#pw-cancel"))==null||c.addEventListener("click",()=>{var p;return(p=e.onCancel)==null?void 0:p.call(e)}),(u=n("#pw-cancel-x"))==null||u.addEventListener("click",()=>{var p;return(p=e.onCancel)==null?void 0:p.call(e)}),(f=n("#pw-current"))==null||f.focus()}class q0{constructor(e,s){this.container=e,this.portal=s}render(){this.container.innerHTML='<div class="py-16 px-4"><div id="forced-pw-host"></div></div>',j0(this.container.querySelector("#forced-pw-host"),{portal:this.portal,forced:!0})}}const _={portal:null,step:"credentials",email:"",challengeId:"",otpDestination:"",devOtp:"",info:"",showPassword:!1};function rd(t){_.portal=t,_.step="credentials",_.email="",_.challengeId="",_.otpDestination="",_.devOtp="",_.info="",_.showPassword=!1}const Ka=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),D0=t=>t instanceof H?t.message:"Something went wrong. Please try again.";class R0{constructor(e,s){h(this,"container");h(this,"portal");this.container=e,this.portal=s,_.portal!==s&&rd(s)}render(){const e=jt[this.portal],s=ya[this.portal],a=x.getState().theme==="light";this.container.innerHTML=`
      <div class="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6">
        
        <!-- Ambient Radial Aura tailored to this portal's color -->
        <div class="absolute inset-0 pointer-events-none opacity-50"
             style="background:radial-gradient(circle 500px at 50% 40%, ${s.accentLight}, transparent 70%)"></div>

        <div class="relative w-full max-w-md space-y-6">
          
          <!-- Authentication Card -->
          <div class="rounded-3xl border shadow-2xl p-7 sm:p-9 space-y-6 transition-all backdrop-blur-xl
                      ${a?"bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50":"bg-slate-900/90 border-slate-800 text-slate-100 shadow-black/60"}">
            
            <!-- Card Header & Portal Brand -->
            <div class="space-y-4 border-b pb-5 ${a?"border-slate-100":"border-slate-800/80"}">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                     style="background:${s.accentLight}; border:1px solid ${s.accentBorder}">
                  ${s.icon}
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full font-mono shadow-sm"
                      style="background:${s.accentLight}; color:${s.accentColor}; border:1px solid ${s.accentBorder}">
                  ${s.badge}
                </span>
              </div>

              <div>
                <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight ${a?"text-slate-900":"text-white"}">
                  ${e.loginTitle}
                </h1>
                <p class="text-xs ${a?"text-slate-500":"text-slate-400"} mt-1 leading-relaxed">
                  ${e.blurb}
                </p>
              </div>

              <!-- Two-Step Progress Pill -->
              <div class="flex items-center gap-2 pt-1">
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${_.step==="credentials"?"bg-blue-600 text-white":"bg-emerald-600 text-white"}">
                    ${_.step==="credentials"?"1":"✓"}
                  </div>
                  <span class="text-[11px] font-semibold ${_.step==="credentials"?a?"text-slate-900":"text-white":"text-emerald-500"}">Credentials</span>
                </div>
                <div class="w-6 h-0.5 ${_.step==="otp"?"bg-emerald-500":a?"bg-slate-200":"bg-slate-800"}"></div>
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${_.step==="otp"?"bg-emerald-600 text-white":a?"bg-slate-200 text-slate-500":"bg-slate-800 text-slate-400"}">
                    2
                  </div>
                  <span class="text-[11px] font-semibold ${_.step==="otp"?"text-emerald-500":a?"text-slate-400":"text-slate-500"}">2FA Passcode</span>
                </div>
              </div>
            </div>

            <!-- Inline Alert Messages -->
            <p id="login-error" class="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl hidden"></p>
            <p id="login-info" class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl ${_.info?"":"hidden"}">${Ka(_.info)}</p>

            <!-- Form Content -->
            ${_.step==="credentials"?this.credentialsHtml(s,a):this.otpHtml(s,a)}

            <!-- Security Notice -->
            <div class="pt-4 border-t ${a?"border-slate-100 text-slate-400":"border-slate-800/80 text-slate-500"} text-[11px] text-center space-y-1">
              <p>Staff accounts are issued by System Administrators.</p>
              <p class="font-mono text-[10px]">🔒 256-bit Encrypted Session · MFA Enforced</p>
            </div>
          </div>

          <!-- Quick Workspace Switcher Bar -->
          <div class="rounded-2xl border p-3.5 text-center transition-all ${a?"bg-white/80 border-slate-200":"bg-slate-900/60 border-slate-800"} backdrop-blur-md">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Switch Workspace</p>
            <div class="grid grid-cols-3 gap-2">
              ${bd.map(n=>{const i=n===this.portal,r=ya[n];return`
                  <button type="button" data-switch-portal="${n}"
                          class="py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border
                                 ${i?"bg-blue-600/10 text-blue-500 border-blue-500/30":a?"bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200":"bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800"}"
                          ${i?"disabled":""}>
                    <span>${r.icon}</span>
                    <span class="truncate">${r.key==="admin"?"Admin":r.key==="recruiter"?"Recruiter":"Proctor"}</span>
                  </button>
                `}).join("")}
            </div>
          </div>

        </div>
      </div>
    `,this.attachEvents()}credentialsHtml(e,s){return`
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"} mb-1.5" for="login-email">
            Staff Username or Email
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
            <input id="login-email" type="text" autocomplete="username" value="${Ka(_.email)}"
              class="w-full pl-9 pr-3.5 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${s?"bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800":"bg-slate-950 border-slate-700 focus:border-blue-500 text-white"}"
              placeholder="username or email" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"}" for="login-password">
              Password
            </label>
            <span class="text-[10px] text-slate-400">Managed by Admin</span>
          </div>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
            <input id="login-password" type="${_.showPassword?"text":"password"}" autocomplete="current-password" value=""
              class="w-full pl-9 pr-10 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${s?"bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800":"bg-slate-950 border-slate-700 focus:border-blue-500 text-white"}"
              placeholder="••••••••••••" />
            <button id="toggle-pwd-btn" type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs">
              ${_.showPassword?"👁️":"👁️‍🗨️"}
            </button>
          </div>
        </div>

        <button id="submit-creds-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r ${e.gradient} ${e.hoverGradient}">
          <span>SEND 2FA EMAIL PASSCODE</span>
          <span>➔</span>
        </button>
      </div>
    `}otpHtml(e,s){return`
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
          <div class="flex items-center gap-2 font-bold text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Two-Factor Code Sent</span>
          </div>
          <p class="text-[11px] ${s?"text-slate-600":"text-slate-300"} leading-relaxed">
            A 6-digit one-time passcode was dispatched to <strong class="font-mono font-bold text-emerald-500">${Ka(_.otpDestination)}</strong>. Code expires in 10 minutes.
          </p>
        </div>

        ${_.devOtp?`
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
            <div>🧪 DEV OTP: <strong class="font-mono tracking-widest text-white">${Ka(_.devOtp)}</strong></div>
            <button id="dev-autofill-btn" type="button" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-[10px] font-bold text-amber-200">
              Auto-fill
            </button>
          </div>
        `:""}

        <div>
          <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"} mb-1.5 text-center" for="login-otp-input">
            Enter 6-Digit Email Passcode
          </label>
          <input id="login-otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value=""
            class="w-full px-4 py-3.5 rounded-xl text-center font-mono text-2xl tracking-[0.6em] font-bold border transition-all outline-none
                   ${s?"bg-slate-50 border-slate-300 focus:border-emerald-600 text-emerald-600":"bg-slate-950 border-slate-700 focus:border-emerald-500 text-emerald-400"}"
            placeholder="------" />
        </div>

        <button id="verify-otp-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
          <span>VERIFY PASSCODE & SIGN IN</span>
          <span>➔</span>
        </button>

        <div class="flex items-center justify-between pt-1">
          <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            Didn't receive code? Resend
          </button>
          <button id="back-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            ← Use different account
          </button>
        </div>
      </div>
    `}showError(e){var a;const s=this.container.querySelector("#login-error");s&&(s.textContent=e,s.classList.toggle("hidden",!e),e&&((a=this.container.querySelector("#login-info"))==null||a.classList.add("hidden")))}run(e,s){const a=e;a&&(a.disabled=!0),this.showError(""),s().catch(n=>this.showError(D0(n))).finally(()=>{a&&a.isConnected&&(a.disabled=!1)}).catch(()=>{})}onEnter(e,s){e==null||e.addEventListener("keydown",a=>{a.key==="Enter"&&(s==null||s.click())})}attachEvents(){var i,r,o;const e=l=>this.container.querySelector(l);if(this.container.querySelectorAll("[data-switch-portal]").forEach(l=>{l.addEventListener("click",()=>{const d=l.getAttribute("data-switch-portal");d&&d!==this.portal&&$e.navigate(jt[d].path)})}),_.step==="credentials"){const l=e("#login-email"),d=e("#login-password"),c=e("#submit-creds-btn"),u=e("#toggle-pwd-btn");this.onEnter(l,c),this.onEnter(d,c),(i=l!=null&&l.value?d:l)==null||i.focus(),u==null||u.addEventListener("click",()=>{_.showPassword=!_.showPassword,d&&(d.type=_.showPassword?"text":"password"),u&&(u.textContent=_.showPassword?"👁️":"👁️‍🗨️")}),c==null||c.addEventListener("click",()=>{const f=((l==null?void 0:l.value)||"").trim(),p=(d==null?void 0:d.value)||"";if(_.email=f,!f||!p){this.showError("Enter your username or email and password.");return}this.run(c,async()=>{c&&(c.innerHTML="<span>Sending 2FA passcode…</span>");const b=await T.login(this.portal,f,p);_.challengeId=b.challengeId,_.otpDestination=b.otpDestination,_.devOtp=b.devOtp||"",_.step="otp",_.info="",this.render()})});return}const s=e("#login-otp-input"),a=e("#verify-otp-btn"),n=e("#dev-autofill-btn");this.onEnter(s,a),s==null||s.focus(),n==null||n.addEventListener("click",()=>{s&&_.devOtp&&(s.value=_.devOtp,s.focus())}),a==null||a.addEventListener("click",()=>{const l=((s==null?void 0:s.value)||"").trim();if(l.length!==6){this.showError("Enter the 6-digit passcode.");return}this.run(a,async()=>{const d=await T.verifyOtp(this.portal,_.challengeId,l);rd(this.portal),x.loginStaff(d.user)})}),(r=e("#resend-otp-btn"))==null||r.addEventListener("click",l=>{this.run(l.currentTarget,async()=>{const d=await T.resendOtp(this.portal,_.challengeId);_.challengeId=d.challengeId,_.devOtp=d.devOtp||"",_.info="A new passcode has been dispatched to your email.",this.render()})}),(o=e("#back-btn"))==null||o.addEventListener("click",()=>{_.step="credentials",_.challengeId="",_.devOtp="",_.info="",this.render()})}}class O0{constructor(){h(this,"appElement");h(this,"navbarHost");h(this,"contentHost");h(this,"footerHost");h(this,"restoring",new Set);h(this,"wasStaffAuthenticated",!1);this.appElement=document.getElementById("app"),this.appElement.innerHTML=`
      <div id="app-shell" class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host" class="sticky top-0 z-50"></div>
        <main id="content-host" class="flex-1"></main>
        <div id="footer-host"></div>
      </div>
    `,this.navbarHost=document.getElementById("navbar-host"),this.contentHost=document.getElementById("content-host"),this.footerHost=document.getElementById("footer-host"),x.subscribe(()=>this.render()),$e.subscribe(()=>{this.syncSession(Os()).catch(e=>console.error("Session restore failed",e)),this.render()})}async syncSession(e){if(e.kind!=="staff")return;const s=e.portal;if(x.getState().isStaffAuthenticated){T.setActivePortal(s);return}if(!this.restoring.has(s)){this.restoring.add(s),x.setAuthReady(!1);try{const n=await T.restoreSession(s);n&&x.loginStaff(n.user)}catch(n){console.error("Session restore failed",n)}finally{this.restoring.delete(s),x.setAuthReady(!0)}}}render(){new Wu(this.navbarHost).render();const s=x.getState(),a=Os(),n=s.examStarted&&!s.examCompleted,i=a.kind==="staff"&&s.isStaffAuthenticated&&!!s.currentUser,r=!n,o=document.getElementById("app-shell");if(o&&(o.className="min-h-screen flex flex-col bg-slate-950 text-slate-100"),r){const u=i?"small":"full";new Gu(this.footerHost,u).render()}else this.footerHost.innerHTML="";if(s.isStaffAuthenticated!==this.wasStaffAuthenticated&&(this.wasStaffAuthenticated=s.isStaffAuthenticated,Vu()),a.kind==="staff"&&(Uu(a.portal,a.section),s.isStaffAuthenticated&&!a.section)){const u=ka(a.portal);u!==window.location.pathname&&window.history.replaceState({},"",u)}if(this.contentHost.innerHTML="",a.kind==="candidate"){new kn(this.contentHost).render(),s.otpVerified?ba.mount():ba.hide();return}ba.hide();const l=a.portal;if(!s.authReady){this.contentHost.innerHTML=`
        <div class="py-24 text-center text-xs text-slate-500 font-mono">Checking your session…</div>
      `;return}if(!s.isStaffAuthenticated||!s.currentUser){new R0(this.contentHost,l).render();return}if(!s.allowedPortals.includes(l)){new M0(this.contentHost,l).render();return}if(s.currentUser.mustChangePassword){new q0(this.contentHost,l).render();return}const d=this.navbarHost.offsetHeight;this.contentHost.innerHTML=`
      <div class="flex flex-col md:flex-row md:items-start flex-1 min-h-[calc(100vh-110px)]">
        <aside id="sidebar-host"
          class="glass-panel w-full md:w-64 md:shrink-0 rounded-none border-0 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:sticky md:overflow-y-auto"
          style="${d?`top:${d}px;height:calc(100vh - ${d}px - 44px)`:""}"></aside>
        <div id="portal-host" class="flex-1 min-w-0"></div>
      </div>
    `,new zu(this.contentHost.querySelector("#sidebar-host"),l).render();const c=this.contentHost.querySelector("#portal-host");l==="admin"?new $p(c).render():l==="recruiter"?new I0(c).render():new ar(c).render()}}document.addEventListener("DOMContentLoaded",async()=>{const t=new URLSearchParams(window.location.search).get("invite"),e=Ru();t&&(e==null?void 0:e.inviteToken)===t&&T.getCandidateToken()?x.hydrateExam(e):t&&(e==null?void 0:e.inviteToken)===t&&e.codeDrafts?x.seedCodeDrafts(e.codeDrafts):e&&t&&e.inviteToken!==t&&T.clearCandidateSession(),window.addEventListener("pagehide",()=>{is(),x.flushExamProgress()});const s=new O0;s.render();try{await s.syncSession(Os())}catch(a){console.error("Session restore failed",a)}finally{x.markAuthReady()}});window.addEventListener("unhandledrejection",t=>{console.error("Unhandled promise rejection:",t.reason)});
//# sourceMappingURL=index-BGFiYImG.js.map
