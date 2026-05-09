
const { analyzeCode } = require('./src/lib/rules/rule-engine.ts');

// Test 1: Python code with JS method
const pyCode = `name = "hello"
result = name.toUpperCase()`;

const pyResult = analyzeCode(pyCode, 'python');
console.log('=== Python with .toUpperCase() ===');
console.log(JSON.stringify(pyResult.issues, null, 2));

// Test 2: JS code with Python method
const jsCode = `const name = "hello";
const result = name.upper();`;

const jsResult = analyzeCode(jsCode, 'javascript');
console.log('\n=== JS with .upper() ===');
console.log(JSON.stringify(jsResult.issues, null, 2));

// Test 3: React deprecated API
const reactCode = `class MyComp extends React.Component {
  componentWillMount() {
    console.log('mounting');
  }
}`;

const reactResult = analyzeCode(reactCode, 'javascript');
console.log('\n=== React componentWillMount ===');
console.log(JSON.stringify(reactResult.issues, null, 2));

// Test 4: Django deprecated
const djangoCode = `from django.conf.urls import url
urlpatterns = [url(r'^home/$', views.home)]`;

const djangoResult = analyzeCode(djangoCode, 'python');
console.log('\n=== Django deprecated url() ===');
console.log(JSON.stringify(djangoResult.issues, null, 2));

console.log('\n=== Summary ===');
console.log('Py->JS issues:', pyResult.issues.length);
console.log('JS->Py issues:', jsResult.issues.length);
console.log('React issues:', reactResult.issues.length);
console.log('Django issues:', djangoResult.issues.length);
