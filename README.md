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