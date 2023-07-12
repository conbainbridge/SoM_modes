.PHONY: run test

certs/key.pem certs/cert.pem:
	mkdir -p certs
	openssl req -x509 -newkey rsa:4096 -nodes -keyout certs/key.pem -out certs/cert.pem -days 365	

run: certs/key.pem certs/cert.pem
	http-server -S -C certs/cert.pem -K certs/key.pem

test:
	python audio_tools/audio.py --input test_data/jack_test.json --output test.wav


