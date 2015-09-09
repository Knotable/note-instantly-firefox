#!/bin/sh

# 1. staging

## 1.1 change environment to staging js/background/config.js
sed -i '' 's/runtime_mode = \"dev\"/runtime_mode = \"staging\"/g' js/background/config.js 


## 1.2 staging package
git stash
git archive -o k-note-instantly.staging.zip 'stash@{0}'
git stash pop
git checkout .



# 2. production

## 2.1 change environment to production js/background/config.js
sed -i '' 's/runtime_mode = \"staging\"/runtime_mode = \"production\"/g' js/background/config.js 
sed -i '' 's/runtime_mode = \"dev\"/runtime_mode = \"production\"/g' js/background/config.js 


## 2.2 delete key field in manifest.json

sed -i '' 's/^.*"key":.*$//g' manifest.json


## 2.3 change google oauth key and secret in js/newtab/google-Aauth.js
sed -i '' 's/825290203046-omj0vpqneirc8tcap02rnkgkfd1tkul5.apps.googleusercontent.com/538240089546-rhdo18f2q9m59qghg22lphqiku3psh9s.apps.googleusercontent.com/g' js/newtab/google-oAuth.js

sed -i '' 's/AIzaSyC1v-nhSh8PJZp9X4443nQqjX03b23QYFw/AIzaSyCjWQEdHw8A11kzJ2HBFyQ_TgtU0H1SkQY/g' js/newtab/google-oAuth.js


## 2.4 package for production
git stash
git archive -o k-note-instantly.production.zip 'stash@{0}'
git stash pop
git checkout .
