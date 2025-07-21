using Booking.Api.Extensions;
using Booking.Api.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using MediatR;
using NSubstitute;
using Xunit;
using System.ComponentModel.DataAnnotations;

namespace Booking.Api.Tests.Unit.Extensions;

public class ValidationExtensionsTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly TestController _controller = new();

    [DateRangeValidation]
    public class TestDtoWithValidation
    {
        [Required]
        public string Name { get; set; } = "";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class TestDtoWithoutValidation
    {
        public string Name { get; set; } = "";
    }

    public class TestController : ControllerBase
    {
        // Empty test controller for extension method testing
    }

    [Fact]
    public async Task ValidateAsync_ValidModel_ReturnsNull()
    {
        // Arrange
        var model = new TestDtoWithoutValidation { Name = "Valid" };

        // Act
        var result = await _controller.ValidateAsync(model, _mediator);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateAsync_InvalidModelState_ReturnsValidationProblem()
    {
        // Arrange
        var model = new TestDtoWithValidation();
        _controller.ModelState.AddModelError("Name", "Name is required");

        // Act
        var result = await _controller.ValidateAsync(model, _mediator);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<ObjectResult>(result);
        
        var badRequestResult = (ObjectResult)result;
        Assert.IsType<ValidationProblemDetails>(badRequestResult.Value);
        
        var problemDetails = (ValidationProblemDetails)badRequestResult.Value!;
        Assert.Contains("Name", problemDetails.Errors.Keys);
    }

    [Fact]
    public void CreateValidationProblem_SingleError_CreatesCorrectProblemDetails()
    {
        // Arrange
        var field = "TestField";
        var message = "Test error message";
        var title = "Test Title";

        // Act
        var result = ValidationExtensions.CreateValidationProblem(field, message, title);

        // Assert
        Assert.Equal(title, result.Title);
        Assert.Equal(400, result.Status);
        Assert.Contains(field, result.Errors.Keys);
        Assert.Contains(message, result.Errors[field]);
    }

    [Fact]
    public void CreateValidationProblem_SingleError_DefaultTitle_CreatesCorrectProblemDetails()
    {
        // Arrange
        var field = "TestField";
        var message = "Test error message";

        // Act
        var result = ValidationExtensions.CreateValidationProblem(field, message);

        // Assert
        Assert.Equal("Validation Error", result.Title);
        Assert.Equal(400, result.Status);
        Assert.Contains(field, result.Errors.Keys);
        Assert.Contains(message, result.Errors[field]);
    }

    [Fact]
    public void CreateValidationProblem_MultipleErrors_CreatesCorrectProblemDetails()
    {
        // Arrange
        var errors = new Dictionary<string, string[]>
        {
            { "Field1", new[] { "Error 1", "Error 2" } },
            { "Field2", new[] { "Error 3" } }
        };
        var title = "Multiple Errors";

        // Act
        var result = ValidationExtensions.CreateValidationProblem(errors, title);

        // Assert
        Assert.Equal(title, result.Title);
        Assert.Equal(400, result.Status);
        Assert.Equal(2, result.Errors.Count);
        Assert.Contains("Field1", result.Errors.Keys);
        Assert.Contains("Field2", result.Errors.Keys);
        Assert.Equal(2, result.Errors["Field1"].Length);
        Assert.Single(result.Errors["Field2"]);
    }

    [Fact]
    public void CreateValidationProblem_MultipleErrors_DefaultTitle_CreatesCorrectProblemDetails()
    {
        // Arrange
        var errors = new Dictionary<string, string[]>
        {
            { "Field1", new[] { "Error 1" } }
        };

        // Act
        var result = ValidationExtensions.CreateValidationProblem(errors);

        // Assert
        Assert.Equal("Validation Error", result.Title);
        Assert.Equal(400, result.Status);
    }

    [Fact]
    public void CreateValidationProblem_EmptyErrors_CreatesEmptyProblemDetails()
    {
        // Arrange
        var errors = new Dictionary<string, string[]>();

        // Act
        var result = ValidationExtensions.CreateValidationProblem(errors);

        // Assert
        Assert.Equal("Validation Error", result.Title);
        Assert.Equal(400, result.Status);
        Assert.Empty(result.Errors);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateValidationProblem_EmptyOrNullMessage_StillAddsError(string? message)
    {
        // Arrange
        var field = "TestField";

        // Act
        var result = ValidationExtensions.CreateValidationProblem(field, message ?? string.Empty);

        // Assert
        Assert.Contains(field, result.Errors.Keys);
        Assert.Single(result.Errors[field]);
    }

    [Fact]
    public void CreateValidationProblem_DuplicateFieldNames_CombinesErrors()
    {
        // Arrange
        var errors = new Dictionary<string, string[]>
        {
            { "Field1", new[] { "Error 1", "Error 2", "Error 1" } } // Duplicate error
        };

        // Act
        var result = ValidationExtensions.CreateValidationProblem(errors);

        // Assert
        Assert.Contains("Field1", result.Errors.Keys);
        Assert.Equal(3, result.Errors["Field1"].Length); // ModelStateDictionary keeps duplicates
    }
}