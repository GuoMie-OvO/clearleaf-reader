import React from 'react';
class ErrorBoundary extends React.Component {
  state = {
    message: '',
  };
  static getDerivedStateFromError(i) {
    return {
      message: i instanceof Error ? i.message : '应用遇到了未知错误',
    };
  }
  componentDidCatch(i, l) {
    console.error('Clearleaf renderer failed', i, l);
  }
  render() {
    return this.state.message ? (
      <main className="fatal-error">
        <h1>{'页面没有正常加载'}</h1>
        <p>{this.state.message}</p>
        <button onClick={() => window.location.reload()}>{'重新加载'}</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export { ErrorBoundary };
