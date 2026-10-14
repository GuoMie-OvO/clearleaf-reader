import React from 'react';
import {
  AlignLeft,
  AlignJustify,
  Columns2,
  Moon,
  SunMedium,
  ScrollText,
  MoveHorizontal,
  ChevronDown,
} from 'lucide-react';
function ReaderSettings({ settings: t, fixedLayout: i, onChange: l }) {
  const s = (o) =>
    l({
      ...t,
      ...o,
    });
  return (
    <div className="settings-content">
      <section>
        <h3>{'翻页方式'}</h3>
        <div className="mode-grid">
          {pageTurnModes.map((o) => {
            const Icon = o.icon;
            return (
              <button
                className={t.mode === o.value ? 'active' : ''}
                onClick={() =>
                  s({
                    mode: o.value,
                  })
                }
                key={o.value}
              >
                <Icon size={18} className={o.value === 'curl' ? 'curl-mode-icon' : ''} />
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
        {i && t.mode === 'scroll' && (
          <p className="setting-note">{'PDF 与漫画会按页面纵向切换；文字类图书支持连续滚动。'}</p>
        )}
      </section>
      <section>
        <h3>{'阅读背景'}</h3>
        <div className="reader-theme-grid">
          {themeChoices.map((o) => (
            <button
              className={t.theme === o.value ? 'active' : ''}
              onClick={() =>
                s({
                  theme: o.value,
                })
              }
              key={o.value}
            >
              <i
                style={{
                  background: o.color,
                }}
              />
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </section>
      {!i && (
        <React.Fragment>
          <section>
            <h3>{'字体与排版'}</h3>
            <label className="select-row">
              <span>{'字体'}</span>
              <select
                value={t.fontFamily}
                onChange={(o) =>
                  s({
                    fontFamily: o.target.value,
                  })
                }
              >
                <option value="serif">{'系统衬线'}</option>
                <option value="sans">{'系统黑体'}</option>
                <option value="song">{'宋体'}</option>
                <option value="kai">{'楷体'}</option>
                <option value="georgia">{'Georgia'}</option>
              </select>
            </label>
            <SettingSlider
              label="字号"
              value={t.fontSize}
              min={13}
              max={36}
              step={1}
              suffix=" px"
              onChange={(o) =>
                s({
                  fontSize: o,
                })
              }
            />
            <SettingSlider
              label="字重"
              value={t.fontWeight}
              min={300}
              max={700}
              step={100}
              onChange={(o) =>
                s({
                  fontWeight: o,
                })
              }
            />
            <SettingSlider
              label="行间距"
              value={t.lineHeight}
              min={1.25}
              max={2.3}
              step={0.05}
              onChange={(o) =>
                s({
                  lineHeight: o,
                })
              }
            />
            <SettingSlider
              label="段间距"
              value={t.paragraphSpacing}
              min={0}
              max={1.8}
              step={0.1}
              suffix=" em"
              onChange={(o) =>
                s({
                  paragraphSpacing: o,
                })
              }
            />
            <SettingSlider
              label="字间距"
              value={t.letterSpacing}
              min={-0.04}
              max={0.16}
              step={0.01}
              suffix=" em"
              onChange={(o) =>
                s({
                  letterSpacing: o,
                })
              }
            />
            <div className="setting-segment">
              <span>{'对齐'}</span>
              <div>
                <button
                  className={t.textAlign === 'start' ? 'active' : ''}
                  onClick={() =>
                    s({
                      textAlign: 'start',
                    })
                  }
                >
                  <AlignLeft size={16} />
                  {' 左对齐'}
                </button>
                <button
                  className={t.textAlign === 'justify' ? 'active' : ''}
                  onClick={() =>
                    s({
                      textAlign: 'justify',
                    })
                  }
                >
                  <AlignJustify size={16} />
                  {' 两端'}
                </button>
              </div>
            </div>
          </section>
          <section>
            <h3>{'页面布局'}</h3>
            <SettingSlider
              label="页边距"
              value={t.margin}
              min={18}
              max={96}
              step={2}
              suffix=" px"
              onChange={(o) =>
                s({
                  margin: o,
                })
              }
            />
            <div className="setting-segment">
              <span>{'分栏'}</span>
              <div>
                <button
                  className={t.columns === 1 ? 'active' : ''}
                  onClick={() =>
                    s({
                      columns: 1,
                    })
                  }
                >
                  {'单栏'}
                </button>
                <button
                  className={t.columns === 2 ? 'active' : ''}
                  onClick={() =>
                    s({
                      columns: 2,
                    })
                  }
                >
                  <Columns2 size={16} />
                  {' 双栏'}
                </button>
              </div>
            </div>
          </section>
        </React.Fragment>
      )}
      <section>
        <h3>{'显示与动效'}</h3>
        <SettingSlider
          label="页面亮度"
          value={t.brightness}
          min={0.55}
          max={1.2}
          step={0.05}
          onChange={(o) =>
            s({
              brightness: o,
            })
          }
        />
        <label className="toggle-row">
          <span>
            <Moon size={16} />
            {' 阅读时自动隐藏工具栏'}
          </span>
          <input
            type="checkbox"
            checked={t.autoHideUi}
            onChange={(o) =>
              s({
                autoHideUi: o.target.checked,
              })
            }
          />
        </label>
        <label className="toggle-row">
          <span>
            <SunMedium size={16} />
            {' 减少动态效果'}
          </span>
          <input
            type="checkbox"
            checked={t.reduceMotion}
            onChange={(o) =>
              s({
                reduceMotion: o.target.checked,
              })
            }
          />
        </label>
      </section>
      <section>
        <h3>{'朗读'}</h3>
        <SettingSlider
          label="语速"
          value={t.ttsRate}
          min={0.5}
          max={2}
          step={0.1}
          onChange={(o) =>
            s({
              ttsRate: o,
            })
          }
        />
        <SettingSlider
          label="音调"
          value={t.ttsPitch}
          min={0.6}
          max={1.5}
          step={0.1}
          onChange={(o) =>
            s({
              ttsPitch: o,
            })
          }
        />
      </section>
    </div>
  );
}
function SettingSlider({ label: t, value: i, min: l, max: s, step: o, suffix: c, onChange: h }) {
  return (
    <label className="setting-slider">
      <span>
        {t}
        <output>
          {Number.isInteger(i) ? i : i.toFixed(2)}
          {c}
        </output>
      </span>
      <input
        type="range"
        min={l}
        max={s}
        step={o}
        value={i}
        onChange={(d) => h(Number(d.target.value))}
      />
    </label>
  );
}
const pageTurnModes = [
  {
    value: 'scroll',
    label: '上下滚动',
    icon: ScrollText,
  },
  {
    value: 'slide',
    label: '左右滑动',
    icon: MoveHorizontal,
  },
  {
    value: 'curl',
    label: '仿真翻页',
    icon: ChevronDown,
  },
  {
    value: 'fade',
    label: '柔和切换',
    icon: SunMedium,
  },
];
const themeChoices = [
  {
    value: 'paper',
    label: '纸白',
    color: '#ffffff',
  },
  {
    value: 'sepia',
    label: '暖黄',
    color: '#f4ecd8',
  },
  {
    value: 'sage',
    label: '护眼',
    color: '#e8f0e4',
  },
  {
    value: 'night',
    label: '夜间',
    color: '#151515',
  },
];
export { ReaderSettings, SettingSlider, pageTurnModes, themeChoices };
