$(document).ready(function () {



    //console.log($("#image")[0].html="bbbb");

    $("#file").on("change", function () {
        console.log("aaaa");

        var fileName = $(this).val();
    
        $(this).next('.custom-file-label').html(fileName);

    });




    $('#btnSubmit').click(function (e) {
   
        event.preventDefault();

        console.log(new Date());


    
     

        var inputFile = $("input[name='file']")[0].files[0];
        var formData = new FormData();
        formData.append('file', inputFile, inputFile.name);
        formData.append('caption', $('#caption').val());
        // = $('#file')//.files[0];
        //alert(inputFile.files.length);
        console.log(inputFile);

        alert(inputFile.name);
        $.ajax({
            
            type: 'POST',
            url: '/upload',
            data: formData,
            encType: "multipart/form-data",
            processData: false,
            contentType: false,
            success: function (data) {

                $("#img1").attr("src", data);
                // $("#ida").attr("href", "/files"+data);
                $("#ida").attr("href", data);
                $("#ida").html(data);
                // location.reload(data);
            }
        });

     //   return false;

        /*
        
                $.ajax({
                    type: "POST",
                    enctype: 'multipart/form-data',
                    url: "/upload",
                    data: data,
                    processData: false,
                    contentType: false,
                    cache: false,
                    timeout: 600000,
                    originalname : "test.txt",
                    success: function (data) {
        
                        $("#result").text(data);
                        console.log("SUCCESS : ", data);
                        $("#btnSubmit").prop("disabled", false);
        
                    },
                    error: function (e) {
        
                        $("#result").text(e.responseText);
                        console.log("ERROR : ", e);
                        $("#btnSubmit").prop("disabled", false);
        
                    }
                 
                });
           */
    })

})
