# EXPRESS HTTP CONNECTION HACKING

A repo for Http connection experimentation in nodejs, using Express.


## NOTES

Random reminders...

Graphite/Statsd docker container startup:

https://hub.docker.com/r/graphiteapp/graphite-statsd


```
docker run -d\
 --name graphite\
 --restart=always\
 -p 80:80\
 -p 2003-2004:2003-2004\
 -p 2023-2024:2023-2024\
 -p 8125:8125/udp\
 -p 8126:8126\
 graphiteapp/graphite-statsd

```

## USAGE

Using mock-api:
```
node index.js ./sample2.json
```

In express-http-connections:
```
node app.js 
```

Then:
```
curl localhost:4000/book
```

Some example tests to observe connection/socket behaviour:
```
ab -t 20 -c 1 localhost:4000/book
ab -t 20 -c 100 localhost:4000/book
ab -t 20 -c 500 localhost:4000/book
```

