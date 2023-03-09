yarn && yarn preprocess
cd localfork
node ForkSetup.js -l
node ForkSetup.js -d
node ForkSetup.js -dp
SCRIPT=`node ForkSetup.js -b`
echo $SCRIPT
cd ..
eval $SCRIPT
