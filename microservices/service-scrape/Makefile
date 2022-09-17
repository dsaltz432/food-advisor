run-local:
	python main.py

docker-build-local:
	docker build . -t gcr.io/fifth-boulder-274618/service-scrape:v1

docker-run-local:
	docker run -it -p 8081:8081 -e PORT='8081' gcr.io/fifth-boulder-274618/service-scrape:v1

docker-build-and-run-local:
	docker build . -t gcr.io/fifth-boulder-274618/service-scrape:v1 && docker run -it -p 8081:8081 -e PORT='8081' gcr.io/fifth-boulder-274618/service-scrape:v1