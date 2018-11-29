all: build

build:
	docker build -t omni:3.1 .

start:
	docker run -itd -p 8080:8080 --name=omni-3-1 omni:3.1

login:
	docker exec -it omni-3-1 bash

.PHONY: build start login