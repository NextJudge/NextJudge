package main

import (
	"net/http"
	"strconv"

	calculator "github.com/NextJudge/NextJudge"
	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()

	e.GET("/", func(c echo.Context) error {
		a := c.QueryParam("a")
		b := c.QueryParam("b")

		numA, _ := strconv.Atoi(a)
		numB, _ := strconv.Atoi(b)

		result := calculator.Add(numA, numB)

		resultStr := strconv.Itoa(result)
		return c.String(http.StatusOK, resultStr)
	})

	e.Logger.Fatal(e.Start(":8080"))
}
