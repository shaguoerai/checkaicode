
import { Issue } from './src/lib/review-types';
import { analyzeCode } from './src/lib/rules/rule-engine';

// Test 1: Python code with JS method
const pyCode = `name = "hello"
result = name.toUpperCase()`;

const pyResult = analyzeCode(pyCode, 'python');
console.log('=== Python with .toUpperCase() ===');
console.log('Issues found:', pyResult.issues.length);
pyResult.issues.forEach((i: Issue) => console.log(`  Line ${i.line}: ${i.title}`));

// Test 2: JS code with Python method
const jsCode = `const name = "hello";
const result = name.upper();`;

const jsResult = analyzeCode(jsCode, 'javascript');
console.log('\n=== JS with .upper() ===');
console.log('Issues found:', jsResult.issues.length);
jsResult.issues.forEach((i: Issue) => console.log(`  Line ${i.line}: ${i.title}`));

// Test 3: React deprecated API
const reactCode = `class MyComp extends React.Component {
  componentWillMount() {
    console.log('mounting');
  }
}`;

const reactResult = analyzeCode(reactCode, 'javascript');
console.log('\n=== React componentWillMount ===');
console.log('Issues found:', reactResult.issues.length);
reactResult.issues.forEach((i: Issue) => console.log(`  Line ${i.line}: ${i.title}`));

// Test 4: Django deprecated
const djangoCode = `from django.conf.urls import url
urlpatterns = [url(r'^home/$', views.home)]`;

const djangoResult = analyzeCode(djangoCode, 'python');
console.log('\n=== Django deprecated url() ===');
console.log('Issues found:', djangoResult.issues.length);
djangoResult.issues.forEach((i: Issue) => console.log(`  Line ${i.line}: ${i.title}`));

// Test 5: Vue deprecated
const vueCode = `Vue.extend({
  data() { return { msg: 'hi' } }
})`;

const vueResult = analyzeCode(vueCode, 'javascript');
console.log('\n=== Vue.extend ===');
console.log('Issues found:', vueResult.issues.length);
vueResult.issues.forEach((i: Issue) => console.log(`  Line ${i.line}: ${i.title}`));

console.log('\n=== Summary ===');
console.log('Py->JS issues:', pyResult.issues.length);
console.log('JS->Py issues:', jsResult.issues.length);
console.log('React issues:', reactResult.issues.length);
console.log('Django issues:', djangoResult.issues.length);
console.log('Vue issues:', vueResult.issues.length);
