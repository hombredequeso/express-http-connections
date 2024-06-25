curl -X POST localhost:4000/resetagent
sleep 1 
curl -X POST localhost:4000/starttest
sleep 4 

ab -t 25 -c 1 -r localhost:4000/book
sleep 5 



curl -X POST localhost:4000/resetagent
sleep 1 
curl -X POST localhost:4000/starttest
sleep 4 

ab -t 25 -c 2 -r localhost:4000/book
sleep 5 



curl -X POST localhost:4000/resetagent
sleep 1 
curl -X POST localhost:4000/starttest
sleep 4 

ab -t 25 -c 3 -r localhost:4000/book
sleep 5 



curl -X POST localhost:4000/resetagent
sleep 1 
curl -X POST localhost:4000/starttest
sleep 4 

ab -t 25 -c 10 -r localhost:4000/book
sleep 5 



curl -X POST localhost:4000/resetagent
sleep 1 
curl -X POST localhost:4000/starttest
sleep 4 

ab -t 25 -c 100 -r localhost:4000/book
sleep 5 

