import React, { Component, PureComponent } from 'react';
import ReactDOM from 'react-dom';

import TimeAgo from 'react-timeago';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './login.css';

import { API_ROOT } from './old_infrastructure/const';
import { get_json, API_VERSION_PARAM } from './old_infrastructure/functions';

import {
  GoogleReCaptchaProvider,
  GoogleReCaptcha,
} from 'react-google-recaptcha-v3';
import ReCAPTCHA from 'react-google-recaptcha';

import UAParser from 'ua-parser-js';

const LOGIN_POPUP_ANCHOR_ID = 'pkuhelper_login_popup_anchor';

class LoginPopupSelf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading_status: 'idle',
      recaptcha_verified: false,
      phase: -1,
      // excluded_scopes: [],
    };

    this.ref = {
      username: React.createRef(),
      email_verification: React.createRef(),
      password: React.createRef(),
      password_confirm: React.createRef(),

      checkbox_terms: React.createRef(),
      checkbox_account: React.createRef(),
    };

    this.popup_anchor = document.getElementById(LOGIN_POPUP_ANCHOR_ID);
    if (!this.popup_anchor) {
      this.popup_anchor = document.createElement('div');
      this.popup_anchor.id = LOGIN_POPUP_ANCHOR_ID;
      document.body.appendChild(this.popup_anchor);
    }
  }

  next_step() {
    if (this.state.loading_status === 'loading') return;
    switch (this.state.phase) {
      case -1:
        this.verify_email('v3', () => {});
        break;
      case 0:
        this.do_login(this.props.token_callback);
        break;
      case 1:
        this.new_user_registration(this.props.token_callback);
        break;
      case 2:
        this.old_user_registration(this.props.token_callback);
        break;
      case 3:
        this.need_recaptcha();
        break;
    }
  }

  valid_registration() {
    if (
      !this.ref.checkbox_terms.current.checked ||
      !this.ref.checkbox_account.current.checked
    ) {
      alert('请同意条款与条件！');
      return 1;
    }
    if (this.ref.password.current.value.length < 8) {
      alert('密码太短，至少应包含8个字符！');
      return 2;
    }
    if (
      this.ref.password.current.value !==
      this.ref.password_confirm.current.value
    ) {
      alert('密码不一致！');
      return 3;
    }
    return 0;
  }

  async sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray
      .map((b) => ('00' + b.toString(16)).slice(-2))
      .join('');
    return hashHex;
  }

  async hashpassword(password) {
    let password_hashed = await this.sha256(password);
    password_hashed = await this.sha256(password_hashed);
    return password_hashed;
  }

  verify_email(version, failed_callback) {
    const old_token = new URL(location.href).searchParams.get('old_token');
    const email = this.ref.username.current.value;
    const recaptcha_version = version;
    const recaptcha_token = localStorage['recaptcha'];
    // VALIDATE EMAIL IN FRONT-END HERE
    const body = new URLSearchParams();
    Object.entries({
      email,
      old_token,
      recaptcha_version,
      recaptcha_token,
    }).forEach((param) => body.append(...param));
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(API_ROOT + 'security/login/check_email?' + API_VERSION_PARAM(), {
          method: 'POST',
          body,
        })
          .then((res) => res.json())
          .then((json) => {
            // COMMENT NEXT LINE
            //json.code = 2;
            if (json.code < 0) throw new Error(json.msg);
            this.setState({
              loading_status: 'done',
              phase: json.code,
            });
            if (json.code === 3) failed_callback();
          })
          .catch((e) => {
            alert('邮箱检验失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
            console.error(e);
          });
      },
    );
  }

  async do_login(set_token) {
    const email = this.ref.username.current.value;
    const password = this.ref.password.current.value;
    let password_hashed = await this.hashpassword(password);
    const device_info = UAParser(navigator.userAgent).browser.name;
    const body = new URLSearchParams();
    Object.entries({
      email,
      password_hashed,
      device_type: 0,
      device_info,
    }).forEach((param) => body.append(...param));

    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(API_ROOT + 'security/login/login?' + API_VERSION_PARAM(), {
          method: 'POST',
          body,
        })
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert('登录成功');
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  async new_user_registration(set_token) {
    if (this.valid_registration() !== 0) return;
    const email = this.ref.username.current.value;
    const valid_code = this.ref.email_verification.current.value;
    const password = this.ref.password.current.value;
    let password_hashed = await this.hashpassword(password);
    const device_info = UAParser(navigator.userAgent).browser.name;
    const body = new URLSearchParams();
    Object.entries({
      email,
      password_hashed,
      device_type: 0,
      device_info,
      valid_code,
    }).forEach((param) => body.append(...param));
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT + 'security/login/create_account?' + API_VERSION_PARAM(),
          {
            method: 'POST',
            body,
          },
        )
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert('登录成功');
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  async old_user_registration(set_token) {
    if (this.valid_registration() !== 0) return;
    const email = this.ref.username.current.value;
    const old_token = new URL(location.href).searchParams.get('old_token');
    const password = this.ref.password.current.value;
    let password_hashed = await this.hashpassword(password);
    const device_info = UAParser(navigator.userAgent).browser.name;
    const body = new URLSearchParams();
    Object.entries({
      email,
      password_hashed,
      device_type: 0,
      device_info,
      old_token,
    }).forEach((param) => body.append(...param));
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT + 'security/login/create_account?' + API_VERSION_PARAM(),
          {
            method: 'POST',
            body,
          },
        )
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert('登录成功');
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  need_recaptcha() {
    console.log(3);
  }

  render() {
    window.recaptchaOptions = {
      useRecaptchaNet: true,
    };
    return ReactDOM.createPortal(
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.REACT_APP_RECAPTCHA_V3_KEY}
        useRecaptchaNet={true}
      >
        <div>
          <div className="treehollow-login-popup-shadow" />
          <div className="treehollow-login-popup margin-popup">
            {this.state.phase === -1 && (
              <>
                <p>
                  <b>输入邮箱来登录 {process.env.REACT_APP_TITLE}</b>
                </p>
              </>
            )}
            <p style={this.state.phase === -1 ? {} : { display: 'none' }}>
              <label>
                邮箱&nbsp;
                <input
                  ref={this.ref.username}
                  type="email"
                  autoFocus={true}
                  defaultValue="@pku.edu.cn"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      this.next_step();
                    }
                  }}
                />
              </label>
            </p>
            {this.state.phase === 0 && (
              <>
                <p>
                  <b>输入密码来登录 {process.env.REACT_APP_TITLE}</b>
                </p>
                <p>
                  <label>
                    密码&nbsp;
                    <input
                      ref={this.ref.password}
                      type="password"
                      autoFocus={true}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          this.next_step();
                        }
                      }}
                    />
                  </label>
                </p>
                <p>
                  <a
                    onClick={() => {
                      alert(
                        '忘记密码？请联系' +
                          process.env.REACT_APP_CONTACT_EMAIL,
                      );
                    }}
                  >
                    忘记密码？
                  </a>
                </p>
              </>
            )}
            {this.state.phase === 1 && (
              <>
                <p>
                  <b>{process.env.REACT_APP_TITLE} 新用户注册</b>
                </p>
                <p>
                  <label>
                    邮箱验证码&nbsp;
                    <input
                      ref={this.ref.email_verification}
                      type="tel"
                      autoFocus={true}
                    />
                  </label>
                </p>
              </>
            )}
            {this.state.phase === 2 && (
              <>
                <p>
                  <b>{process.env.REACT_APP_TITLE} 老用户注册</b>
                </p>
              </>
            )}
            {(this.state.phase === 1 || this.state.phase === 2) && (
              <>
                <p>
                  <label>
                    密码&nbsp;
                    <input ref={this.ref.password} type="password" />
                  </label>
                </p>
                <p>
                  <label>
                    密码确认&nbsp;
                    <input
                      ref={this.ref.password_confirm}
                      type="password"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          this.next_step();
                        }
                      }}
                    />
                  </label>
                </p>
                <p>
                  <label>
                    <input type="checkbox" ref={this.ref.checkbox_terms} />
                    我已经阅读并同意了
                    <a href={process.env.REACT_APP_TOS_URL}>服务协议</a>、
                    <a href={process.env.REACT_APP_PRIVACY_URL}>隐私政策</a>和
                    <a href={process.env.REACT_APP_RULES_URL}>社区规范</a>。
                  </label>
                </p>
                <p>
                  <label>
                    <input type="checkbox" ref={this.ref.checkbox_account} />
                    我已经了解了用户的个人信息会通过设定的密码加密，如果忘记密码会很难找回账户。
                  </label>
                </p>
              </>
            )}
            {this.state.phase === 3 && (
              <>
                <p>
                  <b>输入验证码 {process.env.REACT_APP_TITLE}</b>
                </p>
                <RecaptchaV2Popup
                  callback={() => {
                    this.verify_email('v2', () => {
                      alert('reCAPTCHA风控系统校验失败');
                    });
                  }}
                >
                  {(do_popup) => (
                    <p>
                      {!this.state.recaptcha_verified && (
                        <GoogleReCaptcha
                          onVerify={(token) => {
                            this.setState({
                              recaptcha_verified: true,
                            });
                            console.log(token);
                            localStorage['recaptcha'] = token;
                            this.verify_email('v3', do_popup);
                          }}
                        />
                      )}
                    </p>
                  )}
                </RecaptchaV2Popup>
              </>
            )}
            <p>
              <button
                onClick={this.next_step.bind(this)}
                disabled={this.state.loading_status === 'loading'}
              >
                下一步
              </button>
              <button onClick={this.props.on_close}>取消</button>
            </p>
          </div>
        </div>
      </GoogleReCaptchaProvider>,
      this.popup_anchor,
    );
  }
}

export class LoginPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popup_show: false,
    };
    this.on_popup_bound = this.on_popup.bind(this);
    this.on_close_bound = this.on_close.bind(this);
  }

  on_popup() {
    this.setState({
      popup_show: true,
    });
  }

  on_close() {
    this.setState({
      popup_show: false,
    });
  }

  render() {
    return (
      <>
        {this.props.children(this.on_popup_bound)}
        {this.state.popup_show && (
          <LoginPopupSelf
            token_callback={this.props.token_callback}
            on_close={this.on_close_bound}
          />
        )}
      </>
    );
  }
}

class RecaptchaV2Popup extends Component {
  constructor(props, context) {
    super(props, context);
    this.onChange = this.onChange.bind(this);
    this.state = {
      popup_show: false,
    };
    this.on_popup_bound = this.on_popup.bind(this);
    this.on_close_bound = this.on_close.bind(this);
  }

  on_popup() {
    this.setState({
      popup_show: true,
    });
  }

  on_close() {
    this.setState({
      popup_show: false,
    });
  }

  componentDidMount() {
    if (this.captchaRef) {
      console.log('started, just a second...');
      this.captchaRef.reset();
      this.captchaRef.execute();
    }
  }

  onChange(recaptchaToken) {
    localStorage['recaptcha'] = recaptchaToken;
    this.setState({
      popup_show: false,
    });
    this.props.callback();
  }

  render() {
    return (
      <>
        {this.props.children(this.on_popup_bound)}
        {this.state.popup_show && (
          <div>
            <div className="treehollow-login-popup-shadow" />
            <div className="treehollow-login-popup">
              <div className="g-recaptcha">
                <ReCAPTCHA
                  ref={(el) => {
                    this.captchaRef = el;
                  }}
                  sitekey={process.env.REACT_APP_RECAPTCHA_V2_KEY}
                  // size={"compact"}
                  onChange={this.onChange}
                />
              </div>

              <p>
                <button onClick={this.on_close_bound}>取消</button>
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
}
