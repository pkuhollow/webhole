import React, { Component, PureComponent } from 'react';
import ReactDOM from 'react-dom';

import TimeAgo from 'react-timeago';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './global.css';
import './widgets.css';

// import appicon_hole from './infrastructure/appicon/hole.png';
// import appicon_imasugu from './infrastructure/appicon/imasugu.png';
// import appicon_imasugu_rev from './infrastructure/appicon/imasugu_rev.png';
// import appicon_syllabus from './infrastructure/appicon/syllabus.png';
// import appicon_score from './infrastructure/appicon/score.png';
// import appicon_course_survey from './infrastructure/appicon/course_survey.png';
// import appicon_dropdown from './infrastructure/appicon/dropdown.png';
// import appicon_dropdown_rev from './infrastructure/appicon/dropdown_rev.png';
// import appicon_homepage from './infrastructure/appicon/homepage.png';
import { API_ROOT } from './const';
import { get_json, API_VERSION_PARAM } from './functions';

import {
  GoogleReCaptchaProvider,
  GoogleReCaptcha,
} from 'react-google-recaptcha-v3';
import ReCAPTCHA from 'react-google-recaptcha';

const LOGIN_POPUP_ANCHOR_ID = 'pkuhelper_login_popup_anchor';

function pad2(x) {
  return x < 10 ? '0' + x : '' + x;
}
export function format_time(time) {
  return `${time.getMonth() + 1}-${pad2(
    time.getDate(),
  )} ${time.getHours()}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
}
const chinese_format = buildFormatter(chineseStrings);
export function Time(props) {
  const time = new Date(props.stamp * 1000);
  return (
    <span className={'time-str'}>
      <TimeAgo
        date={time}
        formatter={chinese_format}
        title={time.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false,
        })}
      />
      &nbsp;
      {!props.short ? format_time(time) : null}
    </span>
  );
}

export function TitleLine(props) {
  return (
    <p className="centered-line title-line aux-margin">
      <span className="black-outline">{props.text}</span>
    </p>
  );
}

export function GlobalTitle(props) {
  return (
    <div className="aux-margin">
      <div className="title">
        <p className="centered-line">{props.text}</p>
      </div>
    </div>
  );
}

// const FALLBACK_APPS = {
//   // id, text, url, icon_normal, icon_hover, new_tab
//   bar: [
//     ['hole', '树洞', '/hole', appicon_hole, null, false],
//     [
//       'imasugu',
//       '教室',
//       '/spare_classroom',
//       appicon_imasugu,
//       appicon_imasugu_rev,
//       false,
//     ],
//     ['syllabus', '课表', '/syllabus', appicon_syllabus, null, false],
//     ['score', '成绩', '/my_score', appicon_score, null, false],
//   ],
//   dropdown: [
//     [
//       'course_survey',
//       '课程测评',
//       'https://courses.pinzhixiaoyuan.com/',
//       appicon_course_survey,
//       null,
//       true,
//     ],
//     ['homepage', '客户端', '/', appicon_homepage, null, true],
//   ],
//   fix: {},
// };
// const SWITCHER_DATA_VER='switcher_2';
// const SWITCHER_DATA_URL=THUHOLE_API_ROOT+'web_static/appswitcher_items.json';

// export class AppSwitcher extends Component {
//     constructor(props) {
//         super(props);
//         this.state={
//             apps: this.get_apps_from_localstorage(),
//         }
//     }
//
//     get_apps_from_localstorage() {
//         let ret=FALLBACK_APPS;
//         if(localStorage['APPSWITCHER_ITEMS'])
//             try {
//                 let content=JSON.parse(localStorage['APPSWITCHER_ITEMS'])[SWITCHER_DATA_VER];
//                 if(!content || !content.bar)
//                     throw new Error('content is empty');
//
//                 ret=content;
//             } catch(e) {
//                 console.error('load appswitcher items from localstorage failed');
//                 console.trace(e);
//             }
//
//         return ret;
//     }
//
//     check_fix() {
//         if(this.state.apps && this.state.apps.fix && this.state.apps.fix[this.props.appid])
//             setTimeout(()=>{
//                 window.HOTFIX_CONTEXT={
//                     build_info: process.env.REACT_APP_BUILD_INFO || '---',
//                     build_env: process.env.NODE_ENV,
//                 };
//                 eval(this.state.apps.fix[this.props.appid]);
//             },1); // make it async so failures won't be critical
//     }
//
//     componentDidMount() {
//         this.check_fix();
//         setTimeout(()=>{
//             fetch(SWITCHER_DATA_URL)
//                 .then((res)=>{
//                     if(!res.ok) throw Error(`网络错误 ${res.status} ${res.statusText}`);
//                     return res.text();
//                 })
//                 .then((txt)=>{
//                     if(txt!==localStorage['APPSWITCHER_ITEMS']) {
//                         console.log('loaded new appswitcher items',txt);
//                         localStorage['APPSWITCHER_ITEMS']=txt;
//
//                         this.setState({
//                             apps: this.get_apps_from_localstorage(),
//                         });
//                     } else {
//                         console.log('appswitcher items unchanged');
//                     }
//                 })
//                 .catch((e)=>{
//                     console.error('loading appswitcher items failed');
//                     console.trace(e);
//                 });
//         },500);
//     }
//
//     componentDidUpdate(prevProps, prevState) {
//         if(this.state.apps!==prevState.apps)
//             this.check_fix();
//     }
//
//     render() {
//         let cur_id=this.props.appid;
//
//         function app_elem([id,title,url,icon_normal,icon_hover,new_tab],no_class=false,ref=null) {
//             return (
//                 <a ref={ref} key={id} className={no_class ? null : ('app-switcher-item'+(id===cur_id ? ' app-switcher-item-current' : ''))}
//                    href={url} target={new_tab ? '_blank' : '_self'}>
//                     {!!icon_normal && [
//                         <img key="normal" src={icon_normal} className="app-switcher-logo-normal" />,
//                         <img key="hover" src={icon_hover||icon_normal} className="app-switcher-logo-hover" />
//                     ]}
//                     <span>{title}</span>
//                 </a>
//             );
//         }
//
//         let dropdown_cur_app=null;
//         this.state.apps.dropdown.forEach((app)=>{
//             if(app[0]===cur_id)
//                 dropdown_cur_app=app;
//         });
//
//         //console.log(JSON.stringify(this.state.apps));
//
//         return (
//             <div className="app-switcher">
//                 <span className="app-switcher-desc app-switcher-left">PKUHelper</span>
//                 {this.state.apps.bar.map((app)=>
//                     app_elem(app)
//                 )}
//                 {!!this.state.apps.dropdown.length &&
//                     <div className={
//                         'app-switcher-item app-switcher-dropdown '
//                         +(dropdown_cur_app ? ' app-switcher-item-current' : '')
//                     }>
//                         <p className="app-switcher-dropdown-title">
//                             {!!dropdown_cur_app ?
//                                 app_elem((()=>{
//                                     let [id,title,_url,icon_normal,icon_hover,_new_tab]=dropdown_cur_app;
//                                     return [id,title+'▾',null,icon_normal,icon_hover,false];
//                                 })(),true) :
//                                 app_elem(['-placeholder-elem','更多▾',null,appicon_dropdown,appicon_dropdown_rev,false],true)
//                             }
//                         </p>
//                         {this.state.apps.dropdown.map((app)=>{
//                             let ref=React.createRef();
//                             return (
//                                 <p key={app[0]} className="app-switcher-dropdown-item" onClick={(e)=>{
//                                     if(!e.target.closest('a') && ref.current)
//                                         ref.current.click();
//                                 }}>
//                                     {app_elem(app,true,ref)}
//                                 </p>
//                             );
//                         })}
//                     </div>
//                 }
//                 <span className="app-switcher-desc app-switcher-right">网页版</span>
//             </div>
//         );
//     }
// }

// class RecaptchaV2Popup extends Component {
//   constructor(props, context) {
//     super(props, context);
//     this.onChange = this.onChange.bind(this);
//     this.state = {
//       popup_show: false,
//     };
//     this.on_popup_bound = this.on_popup.bind(this);
//     this.on_close_bound = this.on_close.bind(this);
//   }
//
//   on_popup() {
//     this.setState({
//       popup_show: true,
//     });
//   }
//   on_close() {
//     this.setState({
//       popup_show: false,
//     });
//   }
//
//   componentDidMount() {
//     if (this.captchaRef) {
//       console.log('started, just a second...');
//       this.captchaRef.reset();
//       this.captchaRef.execute();
//     }
//   }
//   onChange(recaptchaToken) {
//     localStorage['recaptcha'] = recaptchaToken;
//     this.setState({
//       popup_show: false,
//     });
//     this.props.callback();
//   }
//
//   render() {
//     return (
//       <>
//         {this.props.children(this.on_popup_bound)}
//         {this.state.popup_show && (
//           <div>
//             <div className="treehollow-login-popup-shadow" />
//             <div className="treehollow-login-popup">
//               <div className="g-recaptcha">
//                 <ReCAPTCHA
//                   ref={(el) => {
//                     this.captchaRef = el;
//                   }}
//                   sitekey={process.env.REACT_APP_RECAPTCHA_V2_KEY}
//                   // size={"compact"}
//                   onChange={this.onChange}
//                 />
//               </div>
//
//               <p>
//                 <button onClick={this.on_close_bound}>取消</button>
//               </p>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   }
// }
//
// class LoginPopupSelf extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       loading_status: 'idle',
//       recaptcha_verified: false,
//       // excluded_scopes: [],
//     };
//     this.username_ref = React.createRef();
//     this.password_ref = React.createRef();
//     this.input_token_ref = React.createRef();
//
//     this.popup_anchor = document.getElementById(LOGIN_POPUP_ANCHOR_ID);
//     if (!this.popup_anchor) {
//       this.popup_anchor = document.createElement('div');
//       this.popup_anchor.id = LOGIN_POPUP_ANCHOR_ID;
//       document.body.appendChild(this.popup_anchor);
//     }
//   }
//
//   do_sendcode(type, do_popup, recaptcha_version) {
//     if (!this.state.recaptcha_verified) {
//       alert('reCAPTCHA风控系统正在评估您的浏览器安全状态，请稍后重试。');
//       return;
//     }
//     if (this.state.loading_status === 'loading') return;
//
//     this.setState(
//       {
//         loading_status: 'loading',
//       },
//       () => {
//         fetch(
//           API_ROOT +
//             'security/login/send_code' +
//             '?user=' +
//             encodeURIComponent(this.username_ref.current.value) +
//             '&code_type=' +
//             encodeURIComponent(type) +
//             '&recaptcha_version=' +
//             encodeURIComponent(recaptcha_version) +
//             '&recaptcha_token=' +
//             localStorage['recaptcha'] +
//             API_VERSION_PARAM(),
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               excluded_scopes: [],
//             }),
//           },
//         )
//           .then(get_json)
//           .then((json) => {
//             console.log(json);
//             if (!json.success) throw new Error(JSON.stringify(json));
//
//             alert(json.msg);
//             this.setState({
//               loading_status: 'done',
//             });
//           })
//           .catch((e) => {
//             console.error(e);
//
//             if (e.toString().includes('风控系统校验失败')) {
//               this.setState({
//                 loading_status: 'done',
//               });
//               do_popup();
//             } else {
//               alert('发送失败\n' + e);
//               this.setState({
//                 loading_status: 'done',
//               });
//             }
//           });
//       },
//     );
//   }
//
//   do_login(set_token) {
//     if (this.state.loading_status === 'loading') return;
//
//     this.setState(
//       {
//         loading_status: 'loading',
//       },
//       () => {
//         fetch(
//           API_ROOT +
//             'security/login/login' +
//             '?user=' +
//             encodeURIComponent(this.username_ref.current.value) +
//             '&valid_code=' +
//             encodeURIComponent(this.password_ref.current.value) +
//             API_VERSION_PARAM(),
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               excluded_scopes: [],
//             }),
//           },
//         )
//           .then(get_json)
//           .then((json) => {
//             if (json.code !== 0) {
//               if (json.msg) throw new Error(json.msg);
//               throw new Error(JSON.stringify(json));
//             }
//
//             set_token(json.user_token);
//             alert(`登录成功`);
//             this.setState({
//               loading_status: 'done',
//             });
//             this.props.on_close();
//           })
//           .catch((e) => {
//             console.error(e);
//             alert('登录失败\n' + e);
//             this.setState({
//               loading_status: 'done',
//             });
//           });
//       },
//     );
//   }
//
//   do_input_token(set_token) {
//     if (this.state.loading_status === 'loading') return;
//
//     let token = this.input_token_ref.current.value;
//     this.setState(
//       {
//         loading_status: 'loading',
//       },
//       () => {
//         fetch(
//           API_ROOT +
//             'contents/system_msg?' +
//             API_VERSION_PARAM(), {
//             headers: {
//               TOKEN: token,
//             }
//           }
//         )
//           .then((res) => res.json())
//           .then((json) => {
//             if (json.error) throw new Error(json.error);
//             if (json.result.length === 0)
//               throw new Error('result check failed');
//             this.setState({
//               loading_status: 'done',
//             });
//             set_token(token);
//             this.props.on_close();
//           })
//           .catch((e) => {
//             alert('Token检验失败\n' + e);
//             this.setState({
//               loading_status: 'done',
//             });
//             console.error(e);
//           });
//       },
//     );
//   }
//
//   // perm_alert() {
//   //     alert('如果你不需要 PKU Helper 的某项功能，可以取消相应权限。\n其中【状态信息】包括你的网费、校园卡余额等。\n该设置应用到你的【所有】设备，取消后如需再次启用相应功能需要重新登录。');
//   // }
//
//   render() {
//     // let PERM_SCOPES=[
//     //     ['score','成绩查询'],
//     //     ['syllabus','课表查询'],
//     //     ['my_info','状态信息'],
//     // ];
//     window.recaptchaOptions = {
//       useRecaptchaNet: true,
//     };
//     return ReactDOM.createPortal(
//       <GoogleReCaptchaProvider
//         reCaptchaKey={process.env.REACT_APP_RECAPTCHA_V3_KEY}
//         useRecaptchaNet={true}
//       >
//         {!this.state.recaptcha_verified && (
//           <GoogleReCaptcha
//             onVerify={(token) => {
//               this.setState({
//                 recaptcha_verified: true,
//               });
//               console.log(token);
//               localStorage['recaptcha'] = token;
//             }}
//           />
//         )}
//         <div>
//           <div className="treehollow-login-popup-shadow" />
//           <div className="treehollow-login-popup">
//             <p>
//               <b>接收验证码来登录 {process.env.REACT_APP_TITLE}</b>
//             </p>
//             <p>
//               <label>
//                 　邮箱&nbsp;
//                 <input
//                   ref={this.username_ref}
//                   type="email"
//                   autoFocus={true}
//                   defaultValue="@mails.tsinghua.edu.cn"
//                 />
//               </label>
//               <span className="treehollow-login-type">
//                 {/*<a onClick={(e)=>this.do_sendcode('sms')}>*/}
//                 {/*    &nbsp;短信&nbsp;*/}
//                 {/*</a>*/}
//                 {/*/*/}
//                 <RecaptchaV2Popup
//                   callback={() => {
//                     this.do_sendcode(
//                       'mail',
//                       () => {
//                         alert('风控系统校验失败');
//                       },
//                       'v2',
//                     );
//                   }}
//                 >
//                   {(do_popup) => (
//                     <a
//                       onClick={(e) => this.do_sendcode('mail', do_popup, 'v3')}
//                     >
//                       &nbsp;发送邮件&nbsp;
//                     </a>
//                   )}
//                 </RecaptchaV2Popup>
//               </span>
//             </p>
//             <p>
//               <label>
//                 验证码&nbsp;
//                 <input ref={this.password_ref} type="tel" />
//               </label>
//               <button
//                 type="button"
//                 disabled={this.state.loading_status === 'loading'}
//                 onClick={(e) => this.do_login(this.props.token_callback)}
//               >
//                 登录
//               </button>
//             </p>
//             <hr />
//             <p>
//               <b>从其他设备导入登录状态</b>
//             </p>
//             <p>
//               <input ref={this.input_token_ref} placeholder="User Token" />
//               <button
//                 type="button"
//                 disabled={this.state.loading_status === 'loading'}
//                 onClick={(e) => this.do_input_token(this.props.token_callback)}
//               >
//                 导入
//               </button>
//             </p>
//             <hr />
//             <p style={{ fontSize: 11 }}>
//               This site is protected by reCAPTCHA and the Google{' '}
//               <a href="https://policies.google.com/privacy">Privacy Policy</a>{' '}
//               and{' '}
//               <a href="https://policies.google.com/terms">Terms of Service</a>{' '}
//               apply.
//             </p>
//             <p>
//               <button onClick={this.props.on_close}>取消</button>
//             </p>
//           </div>
//         </div>
//       </GoogleReCaptchaProvider>,
//       this.popup_anchor,
//     );
//   }
// }
//
// export class LoginPopup extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       popup_show: false,
//     };
//     this.on_popup_bound = this.on_popup.bind(this);
//     this.on_close_bound = this.on_close.bind(this);
//   }
//
//   on_popup() {
//     this.setState({
//       popup_show: true,
//     });
//   }
//   on_close() {
//     this.setState({
//       popup_show: false,
//     });
//   }
//
//   render() {
//     return (
//       <>
//         {this.props.children(this.on_popup_bound)}
//         {this.state.popup_show && (
//           <LoginPopupSelf
//             token_callback={this.props.token_callback}
//             on_close={this.on_close_bound}
//           />
//         )}
//       </>
//     );
//   }
// }
