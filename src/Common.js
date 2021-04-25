import React, { Component, PureComponent } from 'react';
import { format_time, Time, TitleLine } from './old_infrastructure/widgets';

import HtmlToReact from 'html-to-react';

import './Common.css';
import {
  // URL_PID_RE,
  URL_RE,
  PID_RE,
  NICKNAME_RE,
  split_text,
} from './text_splitter';

import renderMd from './Markdown';

export { format_time, Time, TitleLine };

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function escape_regex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function build_highlight_re(txt, split = ' ', option = 'gi') {
  return txt
    ? new RegExp(
        `(${txt
          .split(split)
          .filter((x) => !!x)
          .map(escape_regex)
          .join('|')})`,
        option,
      )
    : /^$/g;
}

export function ColoredSpan(props) {
  return (
    <span
      className="colored-span"
      style={{
        '--coloredspan-bgcolor-light': props.colors[0],
        '--coloredspan-bgcolor-dark': props.colors[1],
      }}
    >
      {props.children}
    </span>
  );
}

function normalize_url(url) {
  return /^https?:\/\//.test(url) ? url : 'http://' + url;
}

export class HighlightedText extends PureComponent {
  render() {
    return (
      <pre>
        {this.props.parts.map((part, idx) => {
          let [rule, p] = part;
          return (
            <span key={idx}>
              {rule === 'url_pid' ? (
                <span className="url-pid-link" title={p}>
                  /##
                </span>
              ) : rule === 'url' ? (
                <a href={normalize_url(p)} target="_blank" rel="noopener">
                  {p}
                </a>
              ) : rule === 'pid' ? (
                <a
                  href={'#' + p}
                  onClick={(e) => {
                    e.preventDefault();
                    this.props.show_pid(p.substring(1));
                  }}
                >
                  {p}
                </a>
              ) : rule === 'nickname' ? (
                <ColoredSpan colors={this.props.color_picker.get(p)}>
                  {p}
                </ColoredSpan>
              ) : rule === 'search' ? (
                <span className="search-query-highlight">{p}</span>
              ) : (
                p
              )}
            </span>
          );
        })}
      </pre>
    );
  }
}

// props: text, show_pid, color_picker
export class HighlightedMarkdown extends Component {
  render() {
    const props = this.props;
    const processDefs = new HtmlToReact.ProcessNodeDefinitions(React);
    const processInstructions = [
      {
        shouldProcessNode: (node) => node.name === 'img', // disable images
        processNode(node, children, index) {
          return <div key={index}>[图片]</div>;
        },
      },
      {
        shouldProcessNode: (node) => /^h[123456]$/.test(node.name),
        processNode(node, children, index) {
          let currentLevel = +node.name[1];
          if (currentLevel < 3) currentLevel = 3;
          const HeadingTag = `h${currentLevel}`;
          return <HeadingTag key={index}>{children}</HeadingTag>;
        },
      },
      {
        shouldProcessNode: (node) => node.name === 'a',
        processNode(node, children, index) {
          return (
            <a
              href={normalize_url(node.attribs.href)}
              target="_blank"
              rel="noopenner noreferrer"
              className="ext-link"
              key={index}
            >
              {children}
              <span className="icon icon-new-tab" />
            </a>
          );
        },
      },
      {
        shouldProcessNode(node) {
          return (
            node.type === 'text' &&
            (!node.parent ||
              !node.parent.attribs ||
              node.parent.attribs['encoding'] !== 'application/x-tex')
          ); // pid, nickname, search
        },
        processNode(node, children, index) {
          const originalText = node.data;
          let hl_rules = [
            // ['url_pid', URL_PID_RE],
            ['url', URL_RE],
            ['pid', PID_RE],
            ['nickname', NICKNAME_RE],
          ];
          if (props.search_param) {
            hl_rules.push([
              'search',
              build_highlight_re(props.search_param, ' ', 'gi'),
            ]);
          }
          const splitted = split_text(originalText, hl_rules);

          return (
            <React.Fragment key={index}>
              {splitted.map(([rule, p], idx) => {
                return (
                  <span key={idx}>
                    {rule === 'url_pid' ? (
                      <span className="url-pid-link" title={p}>
                        /##
                      </span>
                    ) : rule === 'url' ? (
                      <a
                        href={normalize_url(p)}
                        className="ext-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {p}
                        <span className="icon icon-new-tab" />
                      </a>
                    ) : rule === 'pid' ? (
                      <a
                        href={'#' + p}
                        onClick={(e) => {
                          e.preventDefault();
                          props.show_pid(p.substring(1));
                        }}
                      >
                        {p}
                      </a>
                    ) : rule === 'nickname' ? (
                      <ColoredSpan colors={props.color_picker.get(p)}>
                        {p}
                      </ColoredSpan>
                    ) : rule === 'search' ? (
                      <span className="search-query-highlight">{p}</span>
                    ) : (
                      p
                    )}
                  </span>
                );
              })}
            </React.Fragment>
          );
        },
      },
      {
        shouldProcessNode: () => true,
        processNode: processDefs.processDefaultNode,
      },
    ];
    const parser = new HtmlToReact.Parser();
    if (
      props.author &&
      props.text.match(/^(?:#+ |\$\$|>|```|\t|\s*-|\s*\d+\.)/)
    ) {
      const renderedMarkdown = renderMd(props.text);
      return (
        <>
          {props.author}
          {parser.parseWithInstructions(
            renderedMarkdown,
            (node) => node.type !== 'script',
            processInstructions,
          ) || ''}
        </>
      );
    } else {
      let rawMd = props.text;
      if (props.author) rawMd = props.author + ' ' + rawMd;
      const renderedMarkdown = renderMd(rawMd);
      return (
        parser.parseWithInstructions(
          renderedMarkdown,
          (node) => node.type !== 'script',
          processInstructions,
        ) || null
      );
    }
  }
}

window.TEXTAREA_BACKUP = {};

export class SafeTextarea extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
    this.on_change_bound = this.on_change.bind(this);
    this.on_keydown_bound = this.on_keydown.bind(this);
    this.clear = this.clear.bind(this);
    this.area_ref = React.createRef();
    this.change_callback = props.on_change || (() => {});
    this.submit_callback = props.on_submit || (() => {});
  }

  componentDidMount() {
    this.setState(
      {
        text: window.TEXTAREA_BACKUP[this.props.id] || '',
      },
      () => {
        this.change_callback(this.state.text);
      },
    );
  }

  componentWillUnmount() {
    window.TEXTAREA_BACKUP[this.props.id] = this.state.text;
    this.change_callback(this.state.text);
  }

  on_change(event) {
    this.setState({
      text: event.target.value,
    });
    this.change_callback(event.target.value);
  }
  on_keydown(event) {
    if (event.key === 'Enter' && event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.submit_callback();
    }
  }

  clear() {
    this.setState({
      text: '',
    });
  }
  set(text) {
    this.change_callback(text);
    this.setState({
      text: text,
    });
  }
  get() {
    return this.state.text;
  }
  focus() {
    this.area_ref.current.focus();
  }

  render() {
    return (
      <textarea
        ref={this.area_ref}
        onChange={this.on_change_bound}
        value={this.state.text}
        onKeyDown={this.on_keydown_bound}
      />
    );
  }
}

let pwa_prompt_event = null;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('pwa: received before install prompt');
  pwa_prompt_event = e;
});

export function PromotionBar() {
  let is_ios = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  let is_installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;

  if (is_installed) return null;

  if (is_ios)
    // noinspection JSConstructorReturnsPrimitive
    return !navigator.standalone ? (
      <div className="box promotion-bar">
        <span className="icon icon-about" />
        &nbsp; 用 Safari 把树洞 <b>添加到主屏幕</b> 更好用
      </div>
    ) : null;
  // noinspection JSConstructorReturnsPrimitive
  else
    return pwa_prompt_event ? (
      <div className="box promotion-bar">
        <span className="icon icon-about" />
        &nbsp; 把网页版树洞{' '}
        <b>
          <a
            onClick={() => {
              if (pwa_prompt_event) pwa_prompt_event.prompt();
            }}
          >
            安装到桌面
          </a>
        </b>{' '}
        更好用
      </div>
    ) : null;
}

export function BrowserWarningBar() {
  let cr_version = /Chrome\/(\d+)/.exec(navigator.userAgent);
  cr_version = cr_version ? cr_version[1] : 0;
  if (/MicroMessenger\/|QQ\//.test(navigator.userAgent))
    return (
      <div className="box box-tip box-warning">
        <b>您正在使用 QQ/微信 内嵌浏览器</b>
        <br />
        建议使用系统浏览器打开，否则可能出现兼容问题
      </div>
    );
  if (/Edge\/1/.test(navigator.userAgent))
    return (
      <div className="box box-tip box-warning">
        <b>您正在使用旧版 Microsoft Edge</b>
        <br />
        建议使用新版 Edge，否则可能出现兼容问题
      </div>
    );
  else if (cr_version > 1 && cr_version < 57)
    return (
      <div className="box box-tip box-warning">
        <b>您正在使用古老的 Chrome {cr_version}</b>
        <br />
        建议使用新版浏览器，否则可能出现兼容问题
      </div>
    );
  return null;
}

export class ClickHandler extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      moved: true,
      init_y: 0,
      init_x: 0,
    };
    this.on_begin_bound = this.on_begin.bind(this);
    this.on_move_bound = this.on_move.bind(this);
    this.on_end_bound = this.on_end.bind(this);

    this.MOVE_THRESHOLD = 3;
    this.last_fire = 0;
    this.popup_anchor = document.getElementById('img_viewer');
  }

  on_begin(e) {
    //console.log('click',(e.touches?e.touches[0]:e).screenY,(e.touches?e.touches[0]:e).screenX);
    this.setState({
      moved: false,
      init_y: (e.touches ? e.touches[0] : e).screenY,
      init_x: (e.touches ? e.touches[0] : e).screenX,
    });
  }
  on_move(e) {
    if (!this.state.moved) {
      let mvmt =
        Math.abs((e.touches ? e.touches[0] : e).screenY - this.state.init_y) +
        Math.abs((e.touches ? e.touches[0] : e).screenX - this.state.init_x);
      //console.log('move',mvmt);
      if (mvmt > this.MOVE_THRESHOLD)
        this.setState({
          moved: true,
        });
    }
  }
  on_end(event) {
    //console.log('end');
    if (!this.state.moved) this.do_callback(event);
    this.setState({
      moved: true,
    });
  }

  do_callback(event) {
    if (this.last_fire + 100 > +new Date()) return;
    if (this.popup_anchor && this.popup_anchor.children.length !== 0) return;
    this.last_fire = +new Date();
    this.props.callback(event);
  }

  render() {
    return (
      <div
        onTouchStart={this.on_begin_bound}
        onMouseDown={this.on_begin_bound}
        onTouchMove={this.on_move_bound}
        onMouseMove={this.on_move_bound}
        onClick={this.on_end_bound}
      >
        {this.props.children}
      </div>
    );
  }
}
