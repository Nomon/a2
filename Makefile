REPORTER = spec

test:
	@./node_modules/.bin/mocha \
	  --reporter $(REPORTER) \
	  --require assert

.PHONY: test